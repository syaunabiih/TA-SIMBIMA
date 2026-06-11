const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendPush } = require('./push');
const getIO = () => require('../index').io;

// Cron job berjalan setiap 1 menit
const initCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Cari semua kegiatan yang masih BERLANGSUNG dan durasi QR-nya sudah habis
      const expiredKegiatan = await prisma.kegiatanPembinaan.findMany({
        where: {
          status_kegiatan: 'BERLANGSUNG',
          qr_expires_at: {
            lte: now
          }
        },
        select: { id_kegiatan: true }
      });

      if (expiredKegiatan.length > 0) {
        const idList = expiredKegiatan.map(k => k.id_kegiatan);

        // 1. Update status kegiatan menjadi SELESAI
        await prisma.kegiatanPembinaan.updateMany({
          where: { id_kegiatan: { in: idList } },
          data: { status_kegiatan: 'SELESAI' }
        });

        // 2. Nonaktifkan semua petugas yang masih DITUGASKAN -> TIDAK_MENGERJAKAN
        await prisma.petugasAbsensi.updateMany({
          where: {
            id_kegiatan: { in: idList },
            status_tugas: 'DITUGASKAN'
          },
          data: { status_tugas: 'TIDAK_MENGERJAKAN' }
        });

        console.log(`[CRON] ${expiredKegiatan.length} kegiatan presensi otomatis ditutup karena durasi habis.`);
        
        // Emit socket event ke semua client agar me-refresh UI
        try { 
          const io = getIO();
          if (io) {
            io.emit("kegiatan:update", { message: "Presensi otomatis ditutup" }); 
          }
        } catch (_) {}
      }

    } catch (error) {
      console.error('[CRON] Error saat mengecek absensi expired:', error);
    }
  });

  // Cron job berjalan setiap hari jam 08:00 pagi untuk mengingatkan Fasilitator
  // tentang mahasiswa yang belum kembali dari izin
  cron.schedule('0 8 * * *', async () => {
    try {
      const today = new Date();
      today.setHours(0,0,0,0);

      // Cari semua izin yang sudah lewat tanggal selesainya dan belum kembali
      const lateIzins = await prisma.perizinan.findMany({
        where: {
          status_pengajuan: 'DISETUJUI',
          tanggal_selesai: { lt: today },
          konfirmasis: {
            none: { jenis_konfirmasi: 'KEMBALI' }
          }
        },
        include: {
          mahasiswa: { select: { nama: true } }
        }
      });

      if (lateIzins.length > 0) {
        // Kelompokkan berdasarkan fasilitator agar tidak kirim notif satu-satu untuk fasil yang sama
        const lateByFasil = {};
        for (const izin of lateIzins) {
          if (!izin.id_fasilitator_validasi) continue;
          if (!lateByFasil[izin.id_fasilitator_validasi]) {
            lateByFasil[izin.id_fasilitator_validasi] = [];
          }
          lateByFasil[izin.id_fasilitator_validasi].push(izin.mahasiswa.nama);
        }

        const sendPromises = Object.keys(lateByFasil).map(id_fasil => {
          const names = lateByFasil[id_fasil];
          const bodyMsg = names.length > 2 
            ? `${names[0]}, ${names[1]} dan ${names.length - 2} lainnya belum kembali dari izin.`
            : `${names.join(' dan ')} belum kembali dari izin.`;

          return sendPush({ id_fasilitator: Number(id_fasil) }, {
            title: 'Mahasiswa Terlambat Kembali',
            body: bodyMsg,
            url: '/fasilitator/validasi-izin'
          });
        });

        await Promise.allSettled(sendPromises);
        console.log(`[CRON] Terkirim ${Object.keys(lateByFasil).length} notifikasi push untuk izin terlambat.`);
      }
    } catch (error) {
      console.error('[CRON] Error peringatan izin terlambat:', error);
    }
  });

  console.log('⏰ Cron jobs initialized.');
};

module.exports = { initCronJobs };
