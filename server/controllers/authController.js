const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rahasia_negara_simbima"; 

const login = async (req, res) => {
  const { identifier, password } = req.body; 

  if (!identifier || !password) {
    return res.status(400).json({ message: "NIM/NIP dan Password wajib diisi!" });
  }

  try {
    let user = null;
    let role = "";

    // 1. Cek di tabel Mahasiswa
    user = await prisma.mahasiswa.findUnique({ where: { nim: identifier } });
    if (user) {
      // TAMBAHAN: Cek status hunian mahasiswa
      if (user.status_hunian !== "AKTIF") {
        return res.status(403).json({ message: "Akun mahasiswa tidak aktif atau dalam masa skorsing." });
      }
      role = "MAHASISWA";
    }

    // 2. Kalau bukan Mahasiswa, Cek di Fasilitator
    if (!user) {
      user = await prisma.fasilitator.findUnique({ where: { nip: identifier } });
      if (user) role = "FASILITATOR";
    }

    // 3. Kalau bukan Fasilitator, Cek di Ketua Pokja
    if (!user) {
      user = await prisma.ketuaPokja.findUnique({ where: { nip: identifier } });
      if (user) role = "KETUA_POKJA";
    }

    // Kalau user tidak ditemukan
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    // 4. Cek Password 
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password salah!" });
    }

    // 5. Bikin Token (Payload berisi id user dan rolenya)
    const token = jwt.sign(
      { id: user.id_mahasiswa || user.id_fasilitator || user.id_ketua_pokja, role: role },
      JWT_SECRET,
      { expiresIn: "1d" } 
    );

    // 6. Kirim respon sukses
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

module.exports = { login };