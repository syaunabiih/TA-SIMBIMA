const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 1. Fasilitator Membuat Jadwal Kegiatan & Menugaskan Petugas
const buatKegiatan = async (req, res) => {
  const { 
    nama_kegiatan, 
    tanggal_kegiatan, 
    waktu_mulai, 
    waktu_selesai, 
    lokasi, 
    jenis_kegiatan, 
    id_mahasiswa_petugas, // ID mahasiswa yang disuruh jadi petugas absen
    lantai_tanggung_jawab 
  } = req.body;

  try {
    // Ingat, ID fasilitator didapat dari Token (req.user) berkat middleware kita!
    const id_fasilitator = req.user.id;

    // Cari tahu fasilitator ini mengurus gedung mana
    const fasilitator = await prisma.fasilitator.findUnique({
      where: { id_fasilitator: id_fasilitator }
    });

    if (!fasilitator) {
      return res.status(404).json({ message: "Data fasilitator tidak ditemukan." });
    }

    // Insert data kegiatan ke tabel KegiatanPembinaan
    const kegiatanBaru = await prisma.kegiatanPembinaan.create({
      data: {
        nama_kegiatan,
        tanggal_kegiatan: new Date(tanggal_kegiatan),
        waktu_mulai: new Date(`${tanggal_kegiatan}T${waktu_mulai}:00Z`),
        waktu_selesai: new Date(`${tanggal_kegiatan}T${waktu_selesai}:00Z`),
        lokasi,
        jenis_kegiatan,
        id_gedung: fasilitator.id_gedung,
        id_fasilitator: id_fasilitator
      }
    });

    // Jika ada ID mahasiswa yang ditugaskan, langsung masukkan ke tabel PetugasAbsensi
    if (id_mahasiswa_petugas) {
      await prisma.petugasAbsensi.create({
        data: {
          id_kegiatan: kegiatanBaru.id_kegiatan,
          id_mahasiswa: id_mahasiswa_petugas,
          lantai_tanggung_jawab: lantai_tanggung_jawab || 1,
        }
      });
    }

    res.status(201).json({
      status: "Sukses",
      message: "Jadwal kegiatan berhasil dibuat dan petugas telah ditugaskan!",
      data: kegiatanBaru
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat membuat kegiatan." });
  }
};

// 2. Melihat Daftar Kegiatan
const getDaftarKegiatan = async (req, res) => {
  try {
    const daftarKegiatan = await prisma.kegiatanPembinaan.findMany({
      include: {
        petugas: {
          include: { mahasiswa: { select: { nama: true, nim: true } } }
        }
      },
      orderBy: { tanggal_kegiatan: 'desc' }
    });
    
    res.json({
      status: "Sukses",
      data: daftarKegiatan
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data kegiatan." });
  }
};

// 3. Mahasiswa (Petugas) Menginput Kehadiran
const inputKehadiran = async (req, res) => {
  const { id_kegiatan, daftar_hadir } = req.body;
  // Contoh daftar_hadir: [{ id_mahasiswa: 2, status_kehadiran: "HADIR" }, ...]

  try {
    const id_user = req.user.id;
    const role = req.user.role;

    // 1. Pastikan yang mengakses adalah Mahasiswa
    if (role !== "MAHASISWA") {
      return res.status(403).json({ message: "Akses ditolak! Hanya mahasiswa yang bisa menginput absen." });
    }

    // 2. Cek apakah mahasiswa ini BENAR-BENAR petugas untuk kegiatan ini
    const cekPetugas = await prisma.petugasAbsensi.findFirst({
      where: {
        id_kegiatan: id_kegiatan,
        id_mahasiswa: id_user
      }
    });

    if (!cekPetugas) {
      return res.status(403).json({ message: "Maaf, Anda bukan petugas absensi untuk kegiatan ini!" });
    }

    // 3. Siapkan data yang mau dimasukkan ke tabel Kehadiran
    const dataInsert = daftar_hadir.map((item) => ({
      id_kegiatan: id_kegiatan,
      id_mahasiswa: item.id_mahasiswa,
      id_petugas_input: cekPetugas.id_petugas, // Merekam ID petugas yang ngabsen
      status_kehadiran: item.status_kehadiran,
      keterangan: item.keterangan || null,
    }));

    // 4. Masukkan semua data ke database (Bisa banyak sekaligus)
    const simpanAbsen = await prisma.kehadiran.createMany({
      data: dataInsert,
      skipDuplicates: true // Mencegah error kalau ada absen double
    });

    // 5. Update status tugas mahasiswa ini menjadi "SELESAI"
    await prisma.petugasAbsensi.update({
      where: { id_petugas: cekPetugas.id_petugas },
      data: { 
        status_tugas: "SELESAI",
        waktu_submit: new Date()
      }
    });

    res.status(201).json({
      status: "Sukses",
      message: `Berhasil menyimpan ${simpanAbsen.count} data kehadiran!`,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat menyimpan absen." });
  }
};

// Jangan lupa update export-nya agar fungsi ini bisa dipakai!
module.exports = { buatKegiatan, getDaftarKegiatan, inputKehadiran };
