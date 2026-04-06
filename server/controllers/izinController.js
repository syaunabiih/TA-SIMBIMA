const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 0. Melihat Daftar Perizinan (multi-role)
const getDaftarIzin = async (req, res) => {
  try {
    const { id, role } = req.user;
    let whereClause = {};

    if (role === "MAHASISWA") {
      // Mahasiswa hanya lihat izin miliknya sendiri
      whereClause = { id_mahasiswa: id };
    } else if (role === "FASILITATOR") {
      // Fasilitator lihat semua izin di gedungnya
      const fasilitator = await prisma.fasilitator.findUnique({
        where: { id_fasilitator: id }
      });
      if (fasilitator) {
        whereClause = {
          mahasiswa: { id_gedung: fasilitator.id_gedung }
        };
      }
    }
    // KETUA_POKJA -> tidak ada filter, lihat semua

    const daftarIzin = await prisma.perizinan.findMany({
      where: whereClause,
      include: {
        mahasiswa: { select: { nama: true, nim: true, nomor_kamar: true, gedung: { select: { nama_gedung: true } } } },
        fasilitator: { select: { nama: true } },
        konfirmasis: true
      },
      orderBy: { tanggal_pengajuan: 'desc' }
    });

    res.json({
      status: "Sukses",
      data: daftarIzin
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data perizinan." });
  }
};

// 1. Mahasiswa Mengajukan Izin
const ajukanIzin = async (req, res) => {
  const { jenis_izin, tanggal_mulai, tanggal_selesai, alasan, dokumen_pendukung } = req.body;

  try {
    const id_mahasiswa = req.user.id;

    // Pastikan yang mengakses adalah Mahasiswa
    if (req.user.role !== "MAHASISWA") {
      return res.status(403).json({ message: "Akses ditolak! Hanya mahasiswa yang dapat mengajukan izin." });
    }

    // Hitung otomatis durasi hari (misal tgl 10 sampai 12 = 3 hari)
    const mulai = new Date(tanggal_mulai);
    const selesai = new Date(tanggal_selesai);
    const durasi_hari = Math.ceil((selesai - mulai) / (1000 * 60 * 60 * 24)) + 1;

    // Pengecekan Kuota Jika Izin Pulang Kampung
    if (jenis_izin === "PULANG_KAMPUNG") {
      const mhs = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa } });
      if (mhs.kuota_izin_pulang < durasi_hari) {
        return res.status(400).json({ 
          message: `Maaf, kuota izin pulang kampung Anda tersisa ${mhs.kuota_izin_pulang} hari. Pengajuan (${durasi_hari} hari) melebihi kuota.` 
        });
      }
    }

    // Simpan ke tabel Perizinan
    const izinBaru = await prisma.perizinan.create({
      data: {
        jenis_izin,
        tanggal_mulai: mulai,
        tanggal_selesai: selesai,
        durasi_hari,
        alasan,
        dokumen_pendukung: dokumen_pendukung || null,
        id_mahasiswa,
        status_pengajuan: "MENUNGGU"
      }
    });

    res.status(201).json({
      status: "Sukses",
      message: "Pengajuan izin berhasil dikirim dan menunggu validasi Fasilitator.",
      data: izinBaru
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengajukan izin." });
  }
};

// 2. Fasilitator Memvalidasi (Setuju/Tolak) Izin
const validasiIzin = async (req, res) => {
  const { id_perizinan } = req.params; // Diambil dari URL
  const { status_pengajuan, catatan_fasilitator } = req.body; // "DISETUJUI" atau "DITOLAK"

  try {
    const id_fasilitator = req.user.id;

    // Cek apakah data izin ada
    const izin = await prisma.perizinan.findUnique({ 
      where: { id_perizinan: Number(id_perizinan) } 
    });

    if (!izin) {
      return res.status(404).json({ message: "Data pengajuan izin tidak ditemukan." });
    }

    // Update status izin
    const izinUpdate = await prisma.perizinan.update({
      where: { id_perizinan: Number(id_perizinan) },
      data: {
        status_pengajuan,
        catatan_fasilitator,
        id_fasilitator_validasi: id_fasilitator,
        tanggal_validasi: new Date()
      }
    });

    // Jika DISETUJUI dan jenisnya PULANG_KAMPUNG, potong kuota mahasiswa
    if (status_pengajuan === "DISETUJUI" && izin.jenis_izin === "PULANG_KAMPUNG") {
      await prisma.mahasiswa.update({
        where: { id_mahasiswa: izin.id_mahasiswa },
        data: {
          kuota_izin_pulang: {
            decrement: izin.durasi_hari // Kurangi kuota
          }
        }
      });
    }

    // ====================================================
    // 👉 TAMBAHAN: KIRIM NOTIFIKASI OTOMATIS KE MAHASISWA
    // ====================================================
    let pesanNotif = `Pengajuan izin ${izin.jenis_izin.replace('_', ' ').toLowerCase()} Anda telah ${status_pengajuan} oleh Fasilitator.`;
    if (catatan_fasilitator) {
      pesanNotif += ` Catatan: ${catatan_fasilitator}`;
    }

    await prisma.notifikasi.create({
      data: {
        judul: `Status Pengajuan Izin: ${status_pengajuan}`,
        pesan: pesanNotif,
        tipe_notifikasi: "IZIN",
        id_mahasiswa: izin.id_mahasiswa, // Target notifikasi ke mahasiswa
        id_referensi: izin.id_perizinan
      }
    });
    // ====================================================

    res.json({
      status: "Sukses",
      message: `Pengajuan izin berhasil di-${status_pengajuan} dan notifikasi telah dikirim!`,
      data: izinUpdate
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat validasi izin." });
  }
};

// 3. Mahasiswa Konfirmasi (Tiba di tujuan / Kembali ke asrama)
const konfirmasiIzin = async (req, res) => {
  const { id_perizinan, jenis_konfirmasi, lokasi_konfirmasi, keterangan, foto_bukti } = req.body;
  // jenis_konfirmasi wajib berisi: "SAMPAI_TUJUAN" atau "KEMBALI_ASRAMA"

  try {
    const id_mahasiswa = req.user.id;

    // Pastikan yang mengakses adalah Mahasiswa
    if (req.user.role !== "MAHASISWA") {
      return res.status(403).json({ message: "Akses ditolak! Hanya mahasiswa yang dapat melakukan konfirmasi." });
    }

    // Cari data izinnya
    const izin = await prisma.perizinan.findUnique({ 
      where: { id_perizinan: Number(id_perizinan) } 
    });

    // Validasi apakah izin ada, milik dia, dan sudah di-ACC
    if (!izin || izin.id_mahasiswa !== id_mahasiswa) {
      return res.status(404).json({ message: "Data perizinan tidak ditemukan atau bukan milik Anda." });
    }
    if (izin.status_pengajuan !== "DISETUJUI") {
      return res.status(400).json({ message: "Izin ini belum disetujui, tidak bisa melakukan konfirmasi." });
    }

    // Simpan data konfirmasi ke tabel KonfirmasiPerizinan
    const konfirmasiBaru = await prisma.konfirmasiPerizinan.create({
      data: {
        id_perizinan: Number(id_perizinan),
        jenis_konfirmasi, 
        lokasi_konfirmasi,
        keterangan,
        foto_bukti: foto_bukti || null // Nanti ini isinya URL/Path gambar
      }
    });

    // Jika konfirmasinya adalah KEMBALI_ASRAMA, ubah status izin jadi SELESAI
    if (jenis_konfirmasi === "KEMBALI_ASRAMA") {
      await prisma.perizinan.update({
        where: { id_perizinan: Number(id_perizinan) },
        data: { status_pengajuan: "SELESAI" }
      });
    }

    res.status(201).json({
      status: "Sukses",
      message: `Konfirmasi ${jenis_konfirmasi} berhasil dicatat!`,
      data: konfirmasiBaru
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat menyimpan konfirmasi." });
  }
};

// Jangan lupa tambahkan nama fungsinya di export
module.exports = { getDaftarIzin, ajukanIzin, validasiIzin, konfirmasiIzin };