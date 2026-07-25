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
      
      // Cari SEMUA kegiatan yang masih BERLANGSUNG
      const kegiatanBerlangsung = await prisma.kegiatanPembinaan.findMany({
        where: { status_kegiatan: 'BERLANGSUNG' },
        select: { 
          id_kegiatan: true, 
          id_gedung: true,
          tanggal_kegiatan: true, 
          waktu_selesai: true, 
          qr_expires_at: true 
        }
      });

      const expiredKegiatan = [];
      for (const k of kegiatanBerlangsung) {
        let isExpired = false;
        
        // Cek jika durasi QR sudah habis (jika diset, gunakan patokan ini sepenuhnya)
        if (k.qr_expires_at) {
          if (k.qr_expires_at <= now) {
            isExpired = true;
          }
        } else {
          // Cek jika waktu_selesai kegiatan sudah terlewati (hanya jika qr_expires_at tidak ada)
          const t_selesai = new Date(k.tanggal_kegiatan);
          const w_selesai = new Date(k.waktu_selesai);
          t_selesai.setHours(w_selesai.getHours(), w_selesai.getMinutes(), 0);
          if (t_selesai <= now) {
            isExpired = true;
          }
        }

        if (isExpired) expiredKegiatan.push(k);
      }

      if (expiredKegiatan.length > 0) {
        for (const k of expiredKegiatan) {
          // 1. Alfa Otomatis bagi yang belum absen
          const semuaMhs = await prisma.mahasiswa.findMany({
            where: { id_gedung: k.id_gedung, status_hunian: 'AKTIF' },
            select: { id_mahasiswa: true }
          });
          
          const sudahAda = await prisma.kehadiran.findMany({
            where: { id_kegiatan: k.id_kegiatan },
            select: { id_mahasiswa: true }
          });
          const sudahAda_ids = new Set(sudahAda.map(a => a.id_mahasiswa));
          
          const belumTercatat = semuaMhs.filter(m => !sudahAda_ids.has(m.id_mahasiswa));
          
          if (belumTercatat.length > 0) {
            await prisma.kehadiran.createMany({
              data: belumTercatat.map(m => ({
                id_kegiatan: k.id_kegiatan,
                id_mahasiswa: m.id_mahasiswa,
                status_kehadiran: 'ALPHA',
              }))
            });
          }

          // 2. Tutup kegiatan dan batalkan petugas yang belum submit
          await prisma.kegiatanPembinaan.update({
            where: { id_kegiatan: k.id_kegiatan },
            data: { status_kegiatan: 'SELESAI' }
          });
          

        }

        console.log(`[CRON] ${expiredKegiatan.length} kegiatan presensi otomatis ditutup dan diabsenkan ALFA.`);
        
        // Emit socket event ke semua client agar me-refresh UI
        try { 
          const io = getIO();
          if (io) {
            io.emit("kegiatan:update", { message: "Presensi otomatis ditutup" }); 
            io.emit("absensi:update", { message: "Kehadiran otomatis diproses" });
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
