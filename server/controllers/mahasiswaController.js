const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const xlsx = require("xlsx");
const { isEmailInUseGlobally, isValidEmailFormat } = require("../utils/validators");
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

// ==========================================
// 2. Daftar Mahasiswa untuk Fasilitator
// ==========================================
const getDaftarMahasiswaFasilitator = async (req, res) => {
  try {
    const id_fasilitator = req.user.id;
    if (req.user.role !== "FASILITATOR") {
      return res.status(403).json({ message: "Akses ditolak! Khusus Fasilitator." });
    }

    const fasilitator = await prisma.fasilitator.findUnique({
      where: { id_fasilitator }
    });

    if (!fasilitator) {
      return res.status(404).json({ message: "Data fasilitator tidak ditemukan." });
    }

    const mahasiswas = await prisma.mahasiswa.findMany({
      where: { id_gedung: fasilitator.id_gedung },
      include: {
        fakultas: true,
        jurusan: true,
        tahun_akademik: true,
      },
      orderBy: [
        { lantai: 'asc' },
        { nomor_kamar: 'asc' },
        { nama: 'asc' }
      ]
    });

    const activeTA = await prisma.tahunAkademik.findFirst({ where: { is_aktif: true } });

    res.json({
      status: "Sukses",
      message: "Data mahasiswa berhasil diambil",
      data: mahasiswas,
      isTahunAkademikAktif: !!activeTA
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat mengambil data mahasiswa." });
  }
};

// ==========================================
// 3. Tambah Mahasiswa (Fasilitator)
// ==========================================
const tambahMahasiswaFasilitator = async (req, res) => {
  try {
    const id_fasilitator = req.user.id;
    if (req.user.role !== "FASILITATOR") return res.status(403).json({ message: "Akses ditolak!" });

    const fasilitator = await prisma.fasilitator.findUnique({ where: { id_fasilitator } });
    
    const { nim, nama, email, lantai, nomor_kamar, id_fakultas, id_jurusan, alamat_asal, no_telp } = req.body;
    if (!nim || !nama || !email || !lantai || !nomor_kamar) {
      return res.status(400).json({ message: "Field wajib: nim, nama, email, lantai, nomor_kamar" });
    }

    const existNim = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (existNim) return res.status(409).json({ message: "NIM sudah terdaftar." });
    
    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ message: "Format email tidak valid (contoh: nama@email.com)." });
    }
    
    const emailTaken = await isEmailInUseGlobally(email);
    if (emailTaken) return res.status(409).json({ message: "Email ini sudah terdaftar di sistem. Silakan gunakan email lain." });

    const tahunAktif = await prisma.tahunAkademik.findFirst({ where: { is_aktif: true } });
    if (!tahunAktif) {
      return res.status(400).json({ message: "Tidak dapat menambahkan mahasiswa. Pastikan ada Tahun Akademik yang aktif (Hubungi Superadmin)." });
    }
    
    const hashedPassword = await bcrypt.hash(nim, 10);

    const mahasiswa = await prisma.mahasiswa.create({
      data: {
        nim, nama, email, password: hashedPassword,
        lantai: Number(lantai), nomor_kamar, alamat_asal, no_telp,
        id_fakultas: id_fakultas ? Number(id_fakultas) : null,
        id_jurusan: id_jurusan ? Number(id_jurusan) : null,
        id_gedung: fasilitator.id_gedung,
        id_tahun_akademik: tahunAktif ? tahunAktif.id_tahun : null,
        is_first_login: true,
        status_hunian: "AKTIF"
      }
    });

    res.status(201).json({ status: "Sukses", message: "Mahasiswa berhasil ditambahkan.", data: mahasiswa });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menambahkan mahasiswa." });
  }
};

// ==========================================
// 4. Edit Mahasiswa (Fasilitator)
// ==========================================
const editMahasiswaFasilitator = async (req, res) => {
  try {
    const id_mahasiswa = Number(req.params.id);
    const id_fasilitator = req.user.id;
    if (req.user.role !== "FASILITATOR") return res.status(403).json({ message: "Akses ditolak!" });

    const fasilitator = await prisma.fasilitator.findUnique({ where: { id_fasilitator } });
    const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa } });
    
    if (!mahasiswa || mahasiswa.id_gedung !== fasilitator.id_gedung) {
      return res.status(404).json({ message: "Mahasiswa tidak ditemukan di gedung Anda." });
    }

    const { nama, email, lantai, nomor_kamar, id_fakultas, id_jurusan, alamat_asal, no_telp } = req.body;
    
    if (email) {
      if (!isValidEmailFormat(email)) {
        return res.status(400).json({ message: "Format email tidak valid (contoh: nama@email.com)." });
      }
      const emailTaken = await isEmailInUseGlobally(email, "MAHASISWA", id_mahasiswa);
      if (emailTaken) return res.status(409).json({ message: "Email ini sudah terdaftar di sistem. Silakan gunakan email lain." });
    }
    
    const updated = await prisma.mahasiswa.update({
      where: { id_mahasiswa },
      data: {
        nama, email, lantai: Number(lantai), nomor_kamar, alamat_asal, no_telp,
        id_fakultas: id_fakultas ? Number(id_fakultas) : null,
        id_jurusan: id_jurusan ? Number(id_jurusan) : null,
      }
    });

    res.json({ status: "Sukses", message: "Data mahasiswa berhasil diperbarui.", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui mahasiswa." });
  }
};

// ==========================================
// 5. Nonaktifkan Mahasiswa (Fasilitator)
// ==========================================
const nonaktifkanMahasiswaFasilitator = async (req, res) => {
  try {
    const id_mahasiswa = Number(req.params.id);
    const id_fasilitator = req.user.id;
    if (req.user.role !== "FASILITATOR") return res.status(403).json({ message: "Akses ditolak!" });

    const fasilitator = await prisma.fasilitator.findUnique({ where: { id_fasilitator } });
    const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa } });
    
    if (!mahasiswa || mahasiswa.id_gedung !== fasilitator.id_gedung) {
      return res.status(404).json({ message: "Mahasiswa tidak ditemukan di gedung Anda." });
    }

    const updated = await prisma.mahasiswa.update({
      where: { id_mahasiswa },
      data: { status_hunian: "ALUMNI" }
    });

    res.json({ status: "Sukses", message: "Mahasiswa berhasil dinonaktifkan.", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Gagal menonaktifkan mahasiswa." });
  }
};

// ==========================================
// 5.5. Aktifkan Mahasiswa (Fasilitator)
// ==========================================
const aktifkanMahasiswaFasilitator = async (req, res) => {
  try {
    const id_mahasiswa = Number(req.params.id);
    const id_fasilitator = req.user.id;
    if (req.user.role !== "FASILITATOR") return res.status(403).json({ message: "Akses ditolak!" });

    const fasilitator = await prisma.fasilitator.findUnique({ where: { id_fasilitator } });
    const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa } });
    
    if (!mahasiswa || mahasiswa.id_gedung !== fasilitator.id_gedung) {
      return res.status(404).json({ message: "Mahasiswa tidak ditemukan di gedung Anda." });
    }

    const updated = await prisma.mahasiswa.update({
      where: { id_mahasiswa },
      data: { status_hunian: "AKTIF" }
    });

    res.json({ status: "Sukses", message: "Mahasiswa berhasil diaktifkan kembali.", data: updated });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengaktifkan mahasiswa." });
  }
};

// ==========================================
// 6. Reset Password Mahasiswa (Fasilitator)
// ==========================================
const resetPasswordMahasiswaFasilitator = async (req, res) => {
  try {
    const id_mahasiswa = Number(req.params.id);
    const id_fasilitator = req.user.id;
    if (req.user.role !== "FASILITATOR") return res.status(403).json({ message: "Akses ditolak!" });

    const fasilitator = await prisma.fasilitator.findUnique({ where: { id_fasilitator } });
    const mahasiswa = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa } });
    
    if (!mahasiswa || mahasiswa.id_gedung !== fasilitator.id_gedung) {
      return res.status(404).json({ message: "Mahasiswa tidak ditemukan di gedung Anda." });
    }

    const hashedPassword = await bcrypt.hash(mahasiswa.nim, 10);
    await prisma.mahasiswa.update({
      where: { id_mahasiswa },
      data: { password: hashedPassword, is_first_login: true }
    });

    res.json({ status: "Sukses", message: "Password berhasil di-reset ke NIM." });
  } catch (error) {
    res.status(500).json({ message: "Gagal mereset password." });
  }
};

// ==========================================
// 7. Import Excel Mahasiswa (Fasilitator)
// ==========================================
const importMahasiswaFasilitator = async (req, res) => {
  try {
    const id_fasilitator = req.user.id;
    if (req.user.role !== "FASILITATOR") return res.status(403).json({ message: "Akses ditolak!" });

    const fasilitator = await prisma.fasilitator.findUnique({ where: { id_fasilitator } });
    if (!fasilitator) return res.status(404).json({ message: "Fasilitator tidak ditemukan" });

    const data = req.body.data;
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ message: "Data tidak valid" });
    }

    const tahunAktif = await prisma.tahunAkademik.findFirst({ where: { is_aktif: true } });
    if (!tahunAktif) {
      return res.status(400).json({ message: "Tidak dapat mengimport mahasiswa. Pastikan ada Tahun Akademik yang aktif (Hubungi Superadmin)." });
    }
    
    let berhasil = 0;
    let gagal = 0;
    let errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const existNim = await prisma.mahasiswa.findUnique({ where: { nim: String(row.nim) } });
        if (existNim) {
          errors.push({ baris: i + 1, nim: row.nim, pesan: "NIM sudah terdaftar di sistem" });
          gagal++;
          continue;
        }

        const emailStr = String(row.email);
        if (!isValidEmailFormat(emailStr)) {
          errors.push({ baris: i + 1, nim: row.nim, pesan: "Format email tidak valid" });
          gagal++;
          continue;
        }

        const emailTaken = await isEmailInUseGlobally(emailStr);
        if (emailTaken) {
          errors.push({ baris: i + 1, nim: row.nim, pesan: "Email sudah terdaftar di sistem" });
          gagal++;
          continue;
        }

        const hashedPassword = await bcrypt.hash(String(row.nim), 10);
        
        await prisma.mahasiswa.create({
          data: {
            nim: String(row.nim),
            nama: String(row.nama),
            email: String(row.email),
            password: hashedPassword,
            lantai: Number(row.lantai),
            nomor_kamar: String(row.nomor_kamar),
            alamat_asal: row.alamat_asal || null,
            no_telp: row.no_telp || null,
            id_gedung: fasilitator.id_gedung,
            id_tahun_akademik: tahunAktif ? tahunAktif.id_tahun : null,
            is_first_login: true,
            status_hunian: "AKTIF"
          }
        });
        
        berhasil++;
      } catch (err) {
        errors.push({ baris: i + 1, nim: row.nim, pesan: err.message });
        gagal++;
      }
    }

    res.json({ status: "Sukses", message: "Import selesai", data: { berhasil, gagal, errors } });

  } catch (error) {
    console.error("Error import:", error);
    res.status(500).json({ message: "Gagal memproses import data." });
  }
};

const downloadTemplateMahasiswa = (req, res) => {
  try {
    const ws_data = [
      ["NIM", "Nama Lengkap", "Email", "Lantai", "Nomor Kamar", "Alamat Asal", "No. Telp"],
      ["23F10101", "Bagas Santoso", "23f10101@student.unand.ac.id", "1", "A01", "Padang", "08123456789"]
    ];
    
    const ws = xlsx.utils.aoa_to_sheet(ws_data);
    
    const wscols = [
      {wch: 15},
      {wch: 25},
      {wch: 30},
      {wch: 10},
      {wch: 15},
      {wch: 20},
      {wch: 15}
    ];
    ws['!cols'] = wscols;

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Template_Mahasiswa");

    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="Template_Import_Mahasiswa.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error("Template error:", error);
    res.status(500).json({ message: "Gagal membuat template." });
  }
};

module.exports = { getProfilDanRiwayat, getDaftarMahasiswaFasilitator, tambahMahasiswaFasilitator, editMahasiswaFasilitator, nonaktifkanMahasiswaFasilitator, aktifkanMahasiswaFasilitator, resetPasswordMahasiswaFasilitator, importMahasiswaFasilitator, downloadTemplateMahasiswa };