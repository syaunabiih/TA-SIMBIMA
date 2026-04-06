const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ==========================================
// 1. Lihat Histori Kehadiran & Profil Mahasiswa
// ==========================================
const getProfilDanRiwayat = async (req, res) => {
  try {
    const id_mahasiswa = req.user.id;

    // Pastikan yang akses cuma Mahasiswa
    if (req.user.role !== "MAHASISWA") {
      return res.status(403).json({ message: "Akses ditolak! Khusus Mahasiswa." });
    }

    // 1. Ambil data profil (untuk lihat status reward & kuota izin)
    const profil = await prisma.mahasiswa.findUnique({
      where: { id_mahasiswa: id_mahasiswa },
      select: { 
        nama: true, 
        nim: true, 
        status_reward: true, 
        kuota_izin_pulang: true 
      }
    });

    // 2. Ambil histori kehadiran yang nyambung ke tabel kegiatan
    const riwayat_absen = await prisma.kehadiran.findMany({
      where: { id_mahasiswa: id_mahasiswa },
      include: {
        kegiatan: {
          select: {
            nama_kegiatan: true,
            tanggal_kegiatan: true,
            jenis_kegiatan: true
          }
        }
      },
      orderBy: { waktu_absen: 'desc' } // Urutkan dari yang paling baru
    });

    // Hitung ringkasan buat ditampilin di frontend nanti
    const total_hadir = riwayat_absen.filter(a => a.status_kehadiran === "HADIR").length;
    const total_alpha = riwayat_absen.filter(a => a.status_kehadiran === "ALPHA").length;
    const total_izin = riwayat_absen.filter(a => a.status_kehadiran === "IZIN").length;

    res.json({
      status: "Sukses",
      message: "Data histori berhasil diambil",
      data: {
        profil,
        ringkasan: { total_hadir, total_alpha, total_izin },
        riwayat_absen
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat mengambil histori absen." });
  }
};

module.exports = { getProfilDanRiwayat };