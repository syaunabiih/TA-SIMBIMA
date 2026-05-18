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

    // Cek di Ketua Pokja (bisa pakai nip ATAU username kolom nip)
    if (!user) {
      user = await prisma.ketuaPokja.findUnique({ where: { nip: identifier } });
      if (user) role = "SUPERADMIN";
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
        if (user) role = "SUPERADMIN";
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

// ==========================================
// 3. Profil: Get Data Profil
// ==========================================
const getProfile = async (req, res) => {
  try {
    const id = req.user.id;
    const role = req.user.role;
    let user;

    if (role === "MAHASISWA") {
      user = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa: id }, include: { gedung: true } });
    } else if (role === "FASILITATOR") {
      user = await prisma.fasilitator.findUnique({ where: { id_fasilitator: id }, include: { gedung: true } });
    } else if (role === "SUPERADMIN") {
      user = await prisma.ketuaPokja.findUnique({ where: { id_ketua_pokja: id } });
    }

    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    // Hapus data sensitif
    delete user.password;
    res.json({ status: "Sukses", data: user });
  } catch (error) {
    res.status(500).json({ message: "Gagal memuat profil." });
  }
};

// ==========================================
// 4. Profil: Update Data String Saja
// ==========================================
const updateProfile = async (req, res) => {
  const { nama, email, no_telp } = req.body;
  try {
    const id = req.user.id;
    const role = req.user.role;
    let updated;

    if (role === "MAHASISWA") {
      updated = await prisma.mahasiswa.update({ where: { id_mahasiswa: id }, data: { nama, email, no_telp } });
    } else if (role === "FASILITATOR") {
      updated = await prisma.fasilitator.update({ where: { id_fasilitator: id }, data: { nama, email, no_telp } });
    } else if (role === "SUPERADMIN") {
      updated = await prisma.ketuaPokja.update({ where: { id_ketua_pokja: id }, data: { nama, email, no_telp } });
    }

    delete updated.password;
    res.json({ status: "Sukses", message: "Profil berhasil diperbarui", data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menyimpan perubahan." });
  }
};

// ==========================================
// 5. Ganti Password dari Dalam Profil
// ==========================================
const changePassword = async (req, res) => {
  const { passwordLama, passwordBaru } = req.body;
  try {
    const id = req.user.id;
    const role = req.user.role;
    let user;

    if (role === "MAHASISWA") user = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa: id } });
    else if (role === "FASILITATOR") user = await prisma.fasilitator.findUnique({ where: { id_fasilitator: id } });
    else if (role === "SUPERADMIN") user = await prisma.ketuaPokja.findUnique({ where: { id_ketua_pokja: id } });

    const isValid = await bcrypt.compare(passwordLama, user.password);
    if (!isValid) return res.status(400).json({ message: "Password lama Anda salah." });

    const hashedPassword = await bcrypt.hash(passwordBaru, 10);
    
    if (role === "MAHASISWA") await prisma.mahasiswa.update({ where: { id_mahasiswa: id }, data: { password: hashedPassword } });
    else if (role === "FASILITATOR") await prisma.fasilitator.update({ where: { id_fasilitator: id }, data: { password: hashedPassword } });
    else if (role === "SUPERADMIN") await prisma.ketuaPokja.update({ where: { id_ketua_pokja: id }, data: { password: hashedPassword } });

    res.json({ status: "Sukses", message: "Password berhasil diganti!" });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengganti password." });
  }
};

// ==========================================
// 6. Request Lupa Password (Lempar Token)
// ==========================================
const requestResetPassword = async (req, res) => {
  const { kontak } = req.body;
  try {
    // Cari user multi tabel jika cocok email
    let user = await prisma.mahasiswa.findFirst({ where: { email: kontak } });
    if(!user) user = await prisma.fasilitator.findFirst({ where: { email: kontak }});
    if(!user) user = await prisma.ketuaPokja.findFirst({ where: { email: kontak }});

    if (!user) return res.status(404).json({ message: "Akun dengan email ini tidak ditemukan." });

    // Generate random string
    const crypto = require("crypto");
    const tokenStr = crypto.randomBytes(32).toString('hex');
    
    // Simpan ke DB table resetToken (upsert)
    const existing = await prisma.resetToken.findUnique({ where: { email: user.email }});
    const expires_at = new Date(Date.now() + 3600000); // 1 jam dari sekarang
    
    if (existing) {
       await prisma.resetToken.update({ where: { email: user.email }, data: { token: tokenStr, expires_at }});
    } else {
       await prisma.resetToken.create({ data: { email: user.email, token: tokenStr, expires_at }});
    }

    res.json({ 
       status: "Sukses", 
       message: "Link reset password telah dipulihkan. (SIMULASI: Gunakan Token di Bawah)", 
       debug_token: tokenStr 
    });

  } catch(error) {
    res.status(500).json({ message: "Sistem error gagal membuat tiket lupa password." });
  }
};

// ==========================================
// 7. Proses Reset (Submit Data Baru pakai Token)
// ==========================================
const processResetPassword = async (req, res) => {
  const { token, password_baru } = req.body;
  try {
    const validToken = await prisma.resetToken.findUnique({ where: { token }});
    
    if (!validToken || new Date() > validToken.expires_at) {
      return res.status(400).json({ message: "Link tidak valid atau sudah kadaluarsa." });
    }

    const email = validToken.email;
    const hashedPassword = await bcrypt.hash(password_baru, 10);

    // Cari dan update (tapi kita harus tau dia di tabel mana. bruteforce update)
    let updated = false;
    
    const mhs = await prisma.mahasiswa.findFirst({ where: { email }});
    if(mhs) { await prisma.mahasiswa.update({ where: { email }, data: { password: hashedPassword }}); updated = true; }
    
    if(!updated) {
       const fsl = await prisma.fasilitator.findFirst({ where: { email }});
       if (fsl) { await prisma.fasilitator.update({ where: { email }, data: { password: hashedPassword }}); updated = true; }
    }

    if(!updated) {
       const pkj = await prisma.ketuaPokja.findFirst({ where: { email }});
       if(pkj) { await prisma.ketuaPokja.update({ where: { email }, data: { password: hashedPassword }}); }
    }

    // Hapus token
    await prisma.resetToken.delete({ where: { id_token: validToken.id_token } });

    res.json({ status: "Sukses", message: "Password berhasil diretas ulang, silakan login." });
  } catch(error) {
    res.status(500).json({ message: "Kesalahan server" });
  }
};


// Export fungsi-fungsi ke routes
module.exports = { login, resetPassword, getProfile, updateProfile, changePassword, requestResetPassword, processResetPassword };