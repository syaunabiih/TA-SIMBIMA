const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rahasia_negara_simbima"; // Nanti pindahin ke .env ya

const login = async (req, res) => {
  const { identifier, password } = req.body; // identifier bisa NIM atau NIP

  if (!identifier || !password) {
    return res.status(400).json({ message: "NIM/NIP dan Password wajib diisi!" });
  }

  try {
    let user = null;
    let role = "";

    // 1. Cek di tabel Mahasiswa
    user = await prisma.mahasiswa.findUnique({ where: { nim: identifier } });
    if (user) role = "MAHASISWA";

    // 2. Kalau bukan Mahasiswa, Cek di Fasilitator
    if (!user) {
      user = await prisma.fasilitator.findUnique({ where: { nip: identifier } });
      if (user) role = "FASILITATOR";
    }

    // 3. Kalau bukan Fasilitator, Cek di Ketua Pokja (Opsional, buat nanti)
    if (!user) {
      user = await prisma.ketuaPokja.findUnique({ where: { nip: identifier } });
      if (user) role = "KETUA_POKJA";
    }

    // Kalau user tidak ditemukan di manapun
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    // 4. Cek Password (Bandingkan inputan dengan hash di database)
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password salah!" });
    }

    // 5. Bikin Token (Kunci Masuk)
    const token = jwt.sign(
      { id: user.id_mahasiswa || user.id_fasilitator || user.id_ketua_pokja, role: role },
      JWT_SECRET,
      { expiresIn: "1d" } // Token berlaku 1 hari
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