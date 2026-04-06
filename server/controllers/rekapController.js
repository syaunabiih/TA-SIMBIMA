const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ==========================================
// 1. Generate Rekapitulasi Absensi Bulanan
// ==========================================
const generateRekap = async (req, res) => {
  const { bulan, tahun } = req.body;

  try {
    if (req.user.role !== "FASILITATOR") {
      return res.status(403).json({ message: "Akses ditolak! Hanya Fasilitator yang bisa membuat rekap." });
    }

    const id_fasilitator = req.user.id;
    
    // Cari data fasilitator untuk tau dia jaga di gedung mana
    const fasilitator = await prisma.fasilitator.findUnique({
      where: { id_fasilitator }
    });
    const id_gedung = fasilitator.id_gedung;

    // Cari semua kegiatan di bulan & tahun tersebut yang sudah SELESAI di gedungnya
    // (Bulan di JavaScript indexnya mulai dari 0, makanya kita atur manual pakai string ISO)
    const startDate = new Date(`${tahun}-${String(bulan).padStart(2, '0')}-01T00:00:00.000Z`);
    const endDate = new Date(tahun, bulan, 1); // Tanggal 1 bulan depannya

    const kegiatanBulanIni = await prisma.kegiatanPembinaan.findMany({
      where: {
        id_gedung: id_gedung,
        status_kegiatan: "SELESAI",
        tanggal_kegiatan: { gte: startDate, lt: endDate }
      }
    });

    const total_kegiatan = kegiatanBulanIni.length;
    if (total_kegiatan === 0) {
      return res.status(400).json({ message: `Tidak ada kegiatan yang selesai pada bulan ${bulan} tahun ${tahun}.` });
    }

    const idKegiatans = kegiatanBulanIni.map(k => k.id_kegiatan);

    // Cari semua mahasiswa aktif di gedung tersebut
    const mahasiswas = await prisma.mahasiswa.findMany({
      where: { id_gedung, status_hunian: "AKTIF" }
    });

    // Proses hitung absen per mahasiswa
    let rekapDibuat = 0;

    for (const mhs of mahasiswas) {
      // Ambil histori kehadiran mahasiswa ini di kegiatan-kegiatan tadi
      const kehadiranMhs = await prisma.kehadiran.findMany({
        where: { id_mahasiswa: mhs.id_mahasiswa, id_kegiatan: { in: idKegiatans } }
      });

      let total_hadir = 0;
      let total_izin = 0;
      // Termasuk status SAKIT kita anggap sebagai IZIN di sistem agar tidak dihukum
      kehadiranMhs.forEach(k => {
        if (k.status_kehadiran === "HADIR") total_hadir++;
        else if (k.status_kehadiran === "IZIN" || k.status_kehadiran === "SAKIT") total_izin++;
      });

      // Logika: Jika total kehadiran yg diinput kurang dari total_kegiatan, sisanya adalah ALPHA
      const total_alpha = total_kegiatan - (total_hadir + total_izin);
      
      // Hitung persentase kehadiran (mengabaikan izin, yg dihitung persentase hadir dari sisa wajibnya)
      // Kalau mau hitung murni: (Hadir / Total Kegiatan) * 100
      const persentase_kehadiran = (total_hadir / total_kegiatan) * 100;

      // Tentukan status hukuman otomatis berdasarkan rules
      let status_reward = "AMAN";
      if (persentase_kehadiran >= 95) status_reward = "REWARD_TERBAIK";
      else if (persentase_kehadiran < 50) status_reward = "DROP_OUT";
      else if (persentase_kehadiran < 70) status_reward = "PERINGATAN_2";
      else if (persentase_kehadiran < 85) status_reward = "PERINGATAN_1";

      // Cek apakah bulan ini sudah pernah di-generate sebelumnya (kalau iya, kita Update, kalau belum, Create)
      const existingRekap = await prisma.rekapAbsensi.findFirst({
        where: { bulan: Number(bulan), tahun: Number(tahun), id_mahasiswa: mhs.id_mahasiswa }
      });

      if (existingRekap) {
        await prisma.rekapAbsensi.update({
          where: { id_rekap: existingRekap.id_rekap },
          data: { total_kegiatan, total_hadir, total_izin, total_alpha, persentase_kehadiran, status_reward, id_fasilitator_generate: id_fasilitator }
        });
      } else {
        await prisma.rekapAbsensi.create({
          data: {
            bulan: Number(bulan), tahun: Number(tahun), total_kegiatan, total_hadir, total_izin, total_alpha,
            persentase_kehadiran, status_reward, id_gedung, id_mahasiswa: mhs.id_mahasiswa, id_fasilitator_generate: id_fasilitator
          }
        });
      }
      rekapDibuat++;
    }

    res.json({
      status: "Sukses",
      message: `Berhasil men-generate rekap untuk ${rekapDibuat} mahasiswa. Status saat ini: DRAFT (Belum dipublikasikan).`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat men-generate rekap." });
  }
};

// ==========================================
// 2. Publikasi Rekap ke Mahasiswa
// ==========================================
const publikasiRekap = async (req, res) => {
  const { bulan, tahun } = req.body;

  try {
    if (req.user.role !== "FASILITATOR") {
      return res.status(403).json({ message: "Akses ditolak!" });
    }

    const fasilitator = await prisma.fasilitator.findUnique({ where: { id_fasilitator: req.user.id } });

    // Ubah semua rekap bulan & tahun tersebut yang masih DRAFT menjadi PUBLISHED
    const updatePublikasi = await prisma.rekapAbsensi.updateMany({
      where: {
        bulan: Number(bulan),
        tahun: Number(tahun),
        id_gedung: fasilitator.id_gedung,
        status_publikasi: "DRAFT"
      },
      data: {
        status_publikasi: "PUBLISHED",
        tanggal_publikasi: new Date()
      }
    });

    if (updatePublikasi.count === 0) {
      return res.status(404).json({ message: "Tidak ada rekap berstatus DRAFT pada bulan tersebut untuk dipublikasikan." });
    }

    res.json({
      status: "Sukses",
      message: `Berhasil mempublikasikan ${updatePublikasi.count} rekapitulasi. Mahasiswa sekarang dapat melihatnya di dashboard.`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat mempublikasi rekap." });
  }
};

module.exports = { generateRekap, publikasiRekap };