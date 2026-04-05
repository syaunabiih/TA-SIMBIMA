const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 1. Menampilkan Data Dashboard Monitoring
const getDashboardStats = async (req, res) => {
  try {
    // Pastikan yang mengakses adalah Ketua Pokja
    if (req.user.role !== "KETUA_POKJA") {
      return res.status(403).json({ message: "Akses ditolak! Hanya Ketua Pokja yang diizinkan." });
    }

    // Mengambil beberapa statistik dasar untuk Dashboard
    // Menghitung total mahasiswa aktif
    const totalMahasiswa = await prisma.mahasiswa.count({
      where: { status_hunian: "AKTIF" }
    });

    // Menghitung total kegiatan yang sudah dijadwalkan/berjalan
    const totalKegiatan = await prisma.kegiatanPembinaan.count();

    // Menghitung statistik perizinan
    const totalIzinMenunggu = await prisma.perizinan.count({
      where: { status_pengajuan: "MENUNGGU" }
    });
    const totalIzinDisetujui = await prisma.perizinan.count({
      where: { status_pengajuan: "DISETUJUI" }
    });

    res.json({
      status: "Sukses",
      message: "Data Dashboard Monitoring berhasil diambil",
      data: {
        statistik: {
          total_mahasiswa_aktif: totalMahasiswa,
          total_kegiatan_pembinaan: totalKegiatan,
          izin_menunggu_validasi: totalIzinMenunggu,
          izin_sedang_berjalan: totalIzinDisetujui
        }
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat mengambil data dashboard." });
  }
};

// 2. Input Catatan Evaluasi dari Pokja ke Fasilitator
const tambahEvaluasi = async (req, res) => {
  const { id_fasilitator, id_gedung, catatan_evaluasi, bulan_periode, tahun_periode } = req.body;

  try {
    const id_ketua_pokja = req.user.id;

    if (req.user.role !== "KETUA_POKJA") {
      return res.status(403).json({ message: "Akses ditolak! Hanya Ketua Pokja yang dapat memberi evaluasi." });
    }

    // Simpan data evaluasi ke database
    const evaluasiBaru = await prisma.evaluasiPembinaan.create({
      data: {
        id_ketua_pokja,
        id_fasilitator,
        id_gedung,
        catatan_evaluasi,
        bulan_periode,
        tahun_periode
      }
    });

    // (Opsional) Disini bisa ditambah fitur pengiriman Notifikasi otomatis ke Fasilitator
    // lewat tabel Notifikasi (sesuai schema yang kamu buat).

    res.status(201).json({
      status: "Sukses",
      message: "Catatan evaluasi berhasil dikirim ke Fasilitator!",
      data: evaluasiBaru
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat menyimpan evaluasi." });
  }
};

module.exports = { getDashboardStats, tambahEvaluasi };