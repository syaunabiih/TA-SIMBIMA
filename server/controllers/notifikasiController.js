const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ==========================================
// 1. Ambil Semua Notifikasi User
// ==========================================
const getNotifikasi = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    // Filter pencarian berdasarkan role yang sedang login
    let whereClause = {};
    if (role === "MAHASISWA") {
      whereClause = { id_mahasiswa: userId };
    } else if (role === "FASILITATOR") {
      whereClause = { id_fasilitator: userId };
    } else if (role === "KETUA_POKJA") {
      whereClause = { id_ketua_pokja: userId };
    }

    // Ambil data notifikasi, urutkan dari yang paling baru
    const listNotifikasi = await prisma.notifikasi.findMany({
      where: whereClause,
      orderBy: { tanggal_kirim: 'desc' }
    });

    // Hitung berapa notif yang belum dibaca (buat nampilin angka merah di icon lonceng)
    const belum_dibaca = listNotifikasi.filter(n => n.status_baca === false).length;

    res.json({
      status: "Sukses",
      message: "Data notifikasi berhasil diambil",
      data: {
        belum_dibaca,
        notifikasi: listNotifikasi
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat mengambil notifikasi." });
  }
};

// ==========================================
// 2. Tandai Notifikasi Telah Dibaca
// ==========================================
const tandaiDibaca = async (req, res) => {
  const { id_notifikasi } = req.params;

  try {
    const updateNotif = await prisma.notifikasi.update({
      where: { id_notifikasi: Number(id_notifikasi) },
      data: {
        status_baca: true,
        dibaca_pada: new Date()
      }
    });

    res.json({
      status: "Sukses",
      message: "Notifikasi telah ditandai dibaca",
      data: updateNotif
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengubah status notifikasi." });
  }
};

module.exports = { getNotifikasi, tandaiDibaca };