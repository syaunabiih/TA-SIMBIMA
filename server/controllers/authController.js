const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs"); // Pakai bcryptjs sesuai kode kamu
const jwt = require("jsonwebtoken");
const { sendResetPasswordEmail } = require("../utils/mailer");


const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rahasia_negara_simbima"; 

// ==========================================
// 1. Fungsi Login
// ==========================================
const login = async (req, res) => {
  const { identifier, password } = req.body; 
  console.log(`[LOGIN ATTEMPT] identifier="${identifier}" from IP=${req.ip} (UA: ${req.get('user-agent')?.slice(0, 40)})`);

  if (!identifier || !password) {
    return res.status(400).json({ message: "NIM/NIP/Email dan Password wajib diisi!" });
  }

  try {
    let foundUsers = [];

    // Cek di tabel Mahasiswa
    const mhs = await prisma.mahasiswa.findFirst({
      where: {
        OR: [
          { nim: identifier },
          { email: identifier }
        ]
      }
    });
    if (mhs) {
      if (mhs.status_hunian !== "AKTIF") {
        return res.status(403).json({ message: "Akun mahasiswa tidak aktif atau dalam masa skorsing." });
      }
      foundUsers.push({ user: mhs, role: "MAHASISWA" });
    }

    // Cek di Fasilitator
    const fsl = await prisma.fasilitator.findFirst({
      where: {
        OR: [
          { nip: identifier },
          { email: identifier }
        ]
      }
    });
    if (fsl) foundUsers.push({ user: fsl, role: "FASILITATOR" });

    // Cek di Ketua Pokja (bisa pakai nip ATAU username kolom nip)
    const pkj = await prisma.ketuaPokja.findFirst({
      where: {
        OR: [
          { nip: identifier },
          { email: identifier }
        ]
      }
    });
    if (pkj) foundUsers.push({ user: pkj, role: "SUPERADMIN" });

    if (foundUsers.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan!" });
    }

    // Coba cocokkan password dengan akun yang ditemukan (menangani kasus email sama di beda role)
    let validAccount = null;
    for (let account of foundUsers) {
      const isPasswordValid = await bcrypt.compare(password, account.user.password);
      if (isPasswordValid) {
        validAccount = account;
        break; // Berhenti di akun pertama yang password-nya cocok
      }
    }

    if (!validAccount) {
      return res.status(401).json({ message: "Password salah!" });
    }

    const { user, role } = validAccount;

    const token = jwt.sign(
      { id: user.id_mahasiswa || user.id_fasilitator || user.id_ketua_pokja, role: role },
      JWT_SECRET,
      { expiresIn: "24h" } 
    );

    let isFirstLogin = false;
    if (role === "MAHASISWA" && user.is_first_login) {
      isFirstLogin = true;
    }

    res.json({
      status: "Sukses",
      message: "Login Berhasil",
      token: token,
      data: {
        id: user.id_mahasiswa || user.id_fasilitator || user.id_ketua_pokja,
        nama: user.nama,
        role: role,
        isFirstLogin: isFirstLogin
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan di server" });
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

const { isEmailInUseGlobally, isValidEmailFormat } = require("../utils/validators");

// ==========================================
// 4. Profil: Update Data String Saja
// ==========================================
const updateProfile = async (req, res) => {
  const { nama, email, no_telp } = req.body;
  try {
    const id = req.user.id;
    const role = req.user.role;

    if (email) {
      if (!isValidEmailFormat(email)) {
        return res.status(400).json({ message: "Format email tidak valid (contoh: nama@email.com)." });
      }
      
      const emailTaken = await isEmailInUseGlobally(email, role, id);
      if (emailTaken) {
        return res.status(409).json({ message: "Email ini sudah terdaftar di sistem. Silakan gunakan email lain." });
      }
    }
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
// 6. Request Lupa Password (Kirim Email)
// ==========================================
const requestResetPassword = async (req, res) => {
  const { kontak } = req.body;
  try {
    // Cari user di 3 tabel berdasarkan email
    let user = await prisma.mahasiswa.findFirst({ where: { email: kontak } });
    if (!user) user = await prisma.fasilitator.findFirst({ where: { email: kontak } });
    if (!user) user = await prisma.ketuaPokja.findFirst({ where: { email: kontak } });

    // Jika email tidak ditemukan di sistem — kasih error yang jelas
    if (!user) {
      return res.status(404).json({ 
        message: "Email tidak terdaftar di sistem. Periksa kembali alamat email Anda."
      });
    }

    // Generate token acak
    const crypto = require("crypto");
    const tokenStr = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 3600000); // Berlaku 1 jam
    
    // Simpan atau update token di DB
    const existing = await prisma.resetToken.findUnique({ where: { email: user.email } });
    if (existing) {
      await prisma.resetToken.update({ where: { email: user.email }, data: { token: tokenStr, expires_at } });
    } else {
      await prisma.resetToken.create({ data: { email: user.email, token: tokenStr, expires_at } });
    }

    // Buat link reset dan kirim email
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password?token=${tokenStr}`;
    await sendResetPasswordEmail(user.email, user.nama, resetLink);

    // JANGAN kembalikan token di response — user harus buka email
    res.json({ 
      status: "Sukses", 
      message: "Jika email terdaftar, link reset password akan dikirim ke inbox Anda."
    });

  } catch (error) {
    console.error("[requestResetPassword] Error:", error);
    res.status(500).json({ message: "Gagal mengirim email reset password. Coba lagi nanti." });
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


// ==========================================
// 8. Ganti Password Pertama Kali (First Login)
// ==========================================
const firstLoginPasswordChange = async (req, res) => {
  const { passwordBaru } = req.body;
  try {
    const id = req.user.id;
    const role = req.user.role;
    
    if (role !== "MAHASISWA") {
      return res.status(403).json({ message: "Hanya mahasiswa yang dapat melakukan aksi ini." });
    }

    const user = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa: id } });
    if (!user) return res.status(404).json({ message: "User tidak ditemukan." });

    if (!user.is_first_login) {
      return res.status(400).json({ message: "Akun ini sudah pernah mengganti password." });
    }

    const hashedPassword = await bcrypt.hash(passwordBaru, 10);
    await prisma.mahasiswa.update({
      where: { id_mahasiswa: id },
      data: { password: hashedPassword, is_first_login: false }
    });

    res.json({ status: "Sukses", message: "Password berhasil diganti. Silakan lanjutkan login." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengganti password." });
  }
};


// Export fungsi-fungsi ke routes
module.exports = { login, getProfile, updateProfile, changePassword, requestResetPassword, processResetPassword, firstLoginPasswordChange };