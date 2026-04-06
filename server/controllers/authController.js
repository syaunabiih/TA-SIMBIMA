const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs"); // Pakai bcryptjs sesuai kode kamu
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rahasia_negara_simbima"; 

// ==========================================
// 1. Fungsi Login
// ==========================================
const login = async (req, res) => {
  const { identifier, password } = req.body; 

  if (!identifier || !password) {
    return res.status(400).json({ message: "NIM/NIP dan Password wajib diisi!" });
  }

  try {
    let user = null;
    let role = "";

    // Cek di tabel Mahasiswa
    user = await prisma.mahasiswa.findUnique({ where: { nim: identifier } });
    if (user) {
      if (user.status_hunian !== "AKTIF") {
        return res.status(403).json({ message: "Akun mahasiswa tidak aktif atau dalam masa skorsing." });
      }
      role = "MAHASISWA";
    }

    // Cek di Fasilitator
    if (!user) {
      user = await prisma.fasilitator.findUnique({ where: { nip: identifier } });
      if (user) role = "FASILITATOR";
    }

    // Cek di Ketua Pokja
    if (!user) {
      user = await prisma.ketuaPokja.findUnique({ where: { nip: identifier } });
      if (user) role = "KETUA_POKJA";
    }

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password salah!" });
    }

    const token = jwt.sign(
      { id: user.id_mahasiswa || user.id_fasilitator || user.id_ketua_pokja, role: role },
      JWT_SECRET,
      { expiresIn: "1d" } 
    );

    res.json({
      status: "Sukses",
      message: "Login Berhasil",
      token: token,
      data: {
        id: user.id_mahasiswa || user.id_fasilitator || user.id_ketua_pokja,
        nama: user.nama,
        role: role,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan di server" });
  }
};

// ==========================================
// 2. Fungsi Reset Password (TAMBAHAN BARU)
// ==========================================
const resetPassword = async (req, res) => {
  const { identifier, kontak, password_baru } = req.body; 

  try {
    let user = null;
    let role = "";

    // Cari user di 3 tabel
    user = await prisma.mahasiswa.findUnique({ where: { nim: identifier } });
    if (user) {
      role = "MAHASISWA";
    } else {
      user = await prisma.fasilitator.findUnique({ where: { nip: identifier } });
      if (user) {
        role = "FASILITATOR";
      } else {
        user = await prisma.ketuaPokja.findUnique({ where: { nip: identifier } });
        if (user) role = "KETUA_POKJA";
      }
    }

    if (!user) {
      return res.status(404).json({ message: "Akun tidak ditemukan." });
    }

    // Verifikasi Email atau No Telp (Salah satu harus cocok)
    if (user.email !== kontak && user.no_telp !== kontak) {
      return res.status(400).json({ message: "Data Email atau Nomor Telepon tidak cocok." });
    }

    // Hash password baru pakai bcryptjs
    const hashedPassword = await bcrypt.hash(password_baru, 10);

    // Update ke DB sesuai role
    if (role === "MAHASISWA") {
      await prisma.mahasiswa.update({ where: { id_mahasiswa: user.id_mahasiswa }, data: { password: hashedPassword } });
    } else if (role === "FASILITATOR") {
      await prisma.fasilitator.update({ where: { id_fasilitator: user.id_fasilitator }, data: { password: hashedPassword } });
    } else if (role === "KETUA_POKJA") {
      await prisma.ketuaPokja.update({ where: { id_ketua_pokja: user.id_ketua_pokja }, data: { password: hashedPassword } });
    }

    res.json({
      status: "Sukses",
      message: "Password berhasil diperbarui!"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mereset password." });
  }
};

// Export dua-duanya biar bisa dipanggil di routes
module.exports = { login, resetPassword };