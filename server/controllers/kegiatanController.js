const { PrismaClient } = require("@prisma/client");
const { randomUUID } = require("crypto");
const prisma = new PrismaClient();
const { sendPush } = require('../utils/push');

// Lazy-load io untuk menghindari circular dependency
const getIO = () => require('../index').io;

// ── Auto-migrate: tambah kolom QR jika belum ada ─────────────────────────────
let _qrColsChecked = false;
async function ensureQrColumns() {
  if (_qrColsChecked) return;
  try {
    const cols = await prisma.$queryRawUnsafe(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'kegiatan_pembinaan'
         AND COLUMN_NAME IN ('qr_token', 'qr_expires_at')`
    );
    const existing = cols.map(c => c.COLUMN_NAME);
    if (!existing.includes('qr_token')) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE kegiatan_pembinaan ADD COLUMN qr_token VARCHAR(191) NULL`
      );
      await prisma.$executeRawUnsafe(
        `ALTER TABLE kegiatan_pembinaan ADD UNIQUE INDEX qr_token_unique (qr_token)`
      );
    }
    if (!existing.includes('qr_expires_at')) {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE kegiatan_pembinaan ADD COLUMN qr_expires_at DATETIME(3) NULL`
      );
    }
    _qrColsChecked = true;
    console.log('✅ Kolom QR siap.');
  } catch (err) {
    // Kolom sudah ada atau tidak bisa alter — abaikan
    _qrColsChecked = true;
  }
}



const buatKegiatan = async (req, res) => {
  const {
    nama_kegiatan, tanggal_kegiatan, waktu_mulai, waktu_selesai,
    lokasi, id_jenis_kegiatan,
    qr_durasi_menit,      // Durasi QR aktif dalam menit (dari frontend)
    petugas,              // Format baru: [{ lantai, blok, id_mahasiswa }]
    id_mahasiswa_petugas, // Format lama: [id, id, ...]
    lantai_tanggung_jawab
  } = req.body;

  try {
    const id_fasilitator = req.user.id;
    const fasilitator = await prisma.fasilitator.findUnique({ where: { id_fasilitator } });
    if (!fasilitator) return res.status(404).json({ message: "Data fasilitator tidak ditemukan." });

    const tglKegiatan = new Date(tanggal_kegiatan);
    
    // Hitung qr_expires_at berdasarkan waktu mulai kegiatan, bukan Date.now()
    const year = tglKegiatan.getFullYear();
    const month = String(tglKegiatan.getMonth() + 1).padStart(2, '0');
    const day = String(tglKegiatan.getDate()).padStart(2, '0');
    const startTime = new Date(`${year}-${month}-${day}T${waktu_mulai}:00+07:00`);
    
    const durasiMs = (Number(qr_durasi_menit) || 30) * 60 * 1000;
    const qrExpiresAt = new Date(startTime.getTime() + durasiMs);

    const kegiatanBaru = await prisma.kegiatanPembinaan.create({
      data: {
        nama_kegiatan,
        tanggal_kegiatan: tglKegiatan,
        waktu_mulai: new Date(`1970-01-01T${waktu_mulai}:00+07:00`),
        waktu_selesai: new Date(`1970-01-01T${(waktu_selesai || waktu_mulai)}:00+07:00`),
        lokasi, 
        id_jenis_kegiatan: id_jenis_kegiatan ? Number(id_jenis_kegiatan) : null,
        id_gedung: fasilitator.id_gedung,
        id_fasilitator,
      }
    });

    // Inject qr_token & qr_expires_at via raw SQL (agar tidak bergantung prisma generate)
    const newToken = randomUUID();
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE kegiatan_pembinaan SET qr_token = ?, qr_expires_at = ? WHERE id_kegiatan = ?`,
        newToken, qrExpiresAt, kegiatanBaru.id_kegiatan
      );
    } catch (_) {
      // kolom belum ada di DB — abaikan, getQrToken akan generate on-demand
    }

    const tglFormatted = new Date(tanggal_kegiatan).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });



    // Emit realtime event ke semua client
    try { getIO().emit("kegiatan:update", { message: "Kegiatan baru ditambahkan" }); } catch (_) {}

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
    const { bulan, tahun } = req.query;
    let whereClause = {};

    if (bulan && tahun) {
      const startDate = new Date(`${tahun}-${String(bulan).padStart(2, '0')}-01T00:00:00.000Z`);
      const endDate = new Date(Number(tahun), Number(bulan), 1);
      whereClause.tanggal_kegiatan = { gte: startDate, lt: endDate };
    }

    const isMahasiswa = req.user?.role === 'MAHASISWA';
    const isSuperadmin = req.user?.role === 'SUPERADMIN';
    const isFasilitator = req.user?.role === 'FASILITATOR';
    const id_mahasiswa = isMahasiswa ? req.user.id : null;

    // Filter kegiatan berdasarkan gedung:
    // - Fasilitator: hanya kegiatan di gedungnya sendiri
    // - Mahasiswa: hanya kegiatan di gedung tempat tinggalnya
    // - Superadmin: semua kegiatan (tidak difilter)
    if (isFasilitator) {
      const fasilitator = await prisma.fasilitator.findUnique({
        where: { id_fasilitator: req.user.id },
        select: { id_gedung: true }
      });
      if (!fasilitator) return res.status(404).json({ message: 'Data fasilitator tidak ditemukan.' });
      whereClause.id_gedung = fasilitator.id_gedung;
    } else if (isMahasiswa) {
      const mahasiswa = await prisma.mahasiswa.findUnique({
        where: { id_mahasiswa: req.user.id },
        select: { id_gedung: true }
      });
      if (!mahasiswa) return res.status(404).json({ message: 'Data mahasiswa tidak ditemukan.' });
      whereClause.id_gedung = mahasiswa.id_gedung;
    }
    // Superadmin: whereClause tidak difilter id_gedung → tampil semua

    const daftarKegiatan = await prisma.kegiatanPembinaan.findMany({
      where: whereClause,
      include: {
        // Untuk mahasiswa: ambil kehadiran milik dia saja
        ...(isMahasiswa && {
          kehadirans: {
            where: { id_mahasiswa },
            select: { status_kehadiran: true },
          }
        }),
        // Untuk fasilitator/superadmin: tetap sertakan petugas
        ...(!isMahasiswa && {
          fasilitator: { select: { nama: true } },
          gedung: { select: { id_gedung: true, nama_gedung: true } },
          jenis_kegiatan: { select: { id_jenis_kegiatan: true, nama_jenis: true, is_wajib: true } },
          // Untuk menghitung Total Hadir/Alpha di dashboard superadmin/fasilitator
          kehadirans: { select: { status_kehadiran: true } }
        }),
      },

      orderBy: [
        { tanggal_kegiatan: 'desc' },
        { waktu_mulai: 'desc' },
        { created_at: 'desc' }
      ]
    });

    // Sederhanakan field kehadiran
    const result = isMahasiswa
      ? daftarKegiatan.map(k => ({
        ...k,
        status_kehadiran_saya: k.kehadirans?.[0]?.status_kehadiran ?? null,
        kehadirans: undefined,
      }))
      : daftarKegiatan.map(k => {
        let total_hadir = 0, total_alpha = 0;
        if (k.kehadirans) {
          total_hadir = k.kehadirans.filter(x => x.status_kehadiran === 'HADIR').length;
          total_alpha = k.kehadirans.filter(x => x.status_kehadiran === 'ALPHA').length;
        }
        return {
          ...k,
          total_hadir,
          total_alpha,
          // we can remove kehadirans array to save bandwidth if needed, but let's keep it just in case, or remove to be efficient
          kehadirans: undefined
        };
      });

    res.json({ status: "Sukses", data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data kegiatan." });
  }
};



// 4. Edit (Update) Jadwal Kegiatan
const editKegiatan = async (req, res) => {
  const { id_kegiatan } = req.params;
  const {
    nama_kegiatan, deskripsi, tanggal_kegiatan,
    waktu_mulai, waktu_selesai, lokasi, id_jenis_kegiatan, status_kegiatan
  } = req.body;

  try {
    // Pastikan hanya Fasilitator yang bisa edit
    if (req.user.role !== "FASILITATOR") {
      return res.status(403).json({ message: "Akses ditolak! Hanya fasilitator yang dapat mengedit kegiatan." });
    }

    // Update data di database
    const kegiatanUpdate = await prisma.kegiatanPembinaan.update({
      where: { id_kegiatan: Number(id_kegiatan) },
      data: {
        nama_kegiatan,
        deskripsi,
        tanggal_kegiatan: tanggal_kegiatan ? new Date(tanggal_kegiatan) : undefined,
        // Konversi string jam (misal "04:30") ke format ISO Date DateTime Prisma dengan timezone WIB
        waktu_mulai: waktu_mulai ? new Date(`1970-01-01T${waktu_mulai}:00+07:00`) : undefined,
        waktu_selesai: waktu_selesai ? new Date(`1970-01-01T${waktu_selesai}:00+07:00`) : undefined,
        lokasi,
        id_jenis_kegiatan: id_jenis_kegiatan ? Number(id_jenis_kegiatan) : undefined,
        status_kegiatan
      }
    });

    // Emit realtime event ke semua client
    try { getIO().emit("kegiatan:update", { message: "Kegiatan diperbarui" }); } catch (_) {}

    res.json({
      status: "Sukses",
      message: "Jadwal kegiatan berhasil diperbarui!",
      data: kegiatanUpdate
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat mengedit kegiatan." });
  }
};


// 4. Hapus (Delete) Jadwal Kegiatan
const hapusKegiatan = async (req, res) => {
  const { id_kegiatan } = req.params;

  try {
    if (req.user.role !== "FASILITATOR") {
      return res.status(403).json({ message: "Akses ditolak! Hanya fasilitator yang dapat menghapus kegiatan." });
    }

    // Proses hapus data
    await prisma.kegiatanPembinaan.delete({
      where: { id_kegiatan: Number(id_kegiatan) }
    });

    // Emit realtime event ke semua client
    try { getIO().emit("kegiatan:update", { message: "Kegiatan dihapus" }); } catch (_) {}

    res.json({
      status: "Sukses",
      message: "Jadwal kegiatan berhasil dihapus dari sistem."
    });

  } catch (error) {
    console.error(error);
    // Error handling jika kegiatan sudah memiliki data absensi (constraint)
    if (error.code === 'P2003') {
      return res.status(400).json({
        message: "Kegiatan tidak bisa dihapus karena sudah memiliki data absensi mahasiswa. Silakan ubah statusnya menjadi DIBATALKAN."
      });
    }
    res.status(500).json({ message: "Terjadi kesalahan server saat menghapus kegiatan." });
  }
};


// FIX A: Ambil daftar mahasiswa di asrama fasilitator yang login
const getMahasiswaAsrama = async (req, res) => {
  try {
    if (req.user.role !== "FASILITATOR") {
      return res.status(403).json({ message: "Akses ditolak! Hanya Fasilitator." });
    }

    const fasilitator = await prisma.fasilitator.findUnique({
      where: { id_fasilitator: req.user.id }
    });

    if (!fasilitator) {
      return res.status(404).json({ message: "Data fasilitator tidak ditemukan." });
    }

    const mahasiswaList = await prisma.mahasiswa.findMany({
      where: { id_gedung: fasilitator.id_gedung, status_hunian: "AKTIF" },
      select: { id_mahasiswa: true, nama: true, nim: true, lantai: true, nomor_kamar: true },
      orderBy: [{ lantai: 'asc' }, { nama: 'asc' }]
    });

    res.json({ status: "Sukses", data: mahasiswaList });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil daftar mahasiswa asrama." });
  }
};



// Kehadiran per blok (fasilitator lihat rekap per lantai & blok)
const getKehadiranPerBlok = async (req, res) => {
  const { id } = req.params;
  const { lantai, blok, id_gedung: gedungParam } = req.query;

  if (!lantai || !blok) {
    return res.status(400).json({ message: 'Query lantai dan blok wajib diisi.' });
  }

  try {
    let id_gedung;

    if (req.user.role === 'FASILITATOR') {
      // Ambil gedung fasilitator yang login
      const fasilitator = await prisma.fasilitator.findUnique({
        where: { id_fasilitator: req.user.id }
      });
      if (!fasilitator) return res.status(404).json({ message: 'Fasilitator tidak ditemukan.' });
      id_gedung = fasilitator.id_gedung;
    } else if (req.user.role === 'SUPERADMIN') {
      // SUPERADMIN harus kirim id_gedung di query
      if (!gedungParam) return res.status(400).json({ message: 'SUPERADMIN harus menyertakan query id_gedung.' });
      id_gedung = Number(gedungParam);
    } else {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    // Semua mahasiswa di lantai & blok sesuai filter
    const mahasiswaList = await prisma.mahasiswa.findMany({
      where: {
        id_gedung,
        lantai: Number(lantai),
        nomor_kamar: { startsWith: blok.toUpperCase() },
        status_hunian: 'AKTIF',
      },
      select: { id_mahasiswa: true, nama: true, nim: true, nomor_kamar: true },
      orderBy: { nomor_kamar: 'asc' },
    });

    // Ambil data kehadiran yang sudah diisi untuk kegiatan ini
    const kehadiranList = await prisma.kehadiran.findMany({
      where: {
        id_kegiatan: Number(id),
        id_mahasiswa: { in: mahasiswaList.map(m => m.id_mahasiswa) },
      },
      select: { id_kehadiran: true, id_mahasiswa: true, status_kehadiran: true },
    });

    // Map kehadiran ke id_mahasiswa untuk lookup cepat
    const kehadiranMap = {};
    kehadiranList.forEach(k => {
      kehadiranMap[k.id_mahasiswa] = { id_kehadiran: k.id_kehadiran, status: k.status_kehadiran };
    });

    // Gabungkan
    const result = mahasiswaList.map(m => ({
      id_mahasiswa: m.id_mahasiswa,
      nama: m.nama,
      nim: m.nim,
      nomor_kamar: m.nomor_kamar,
      id_kehadiran: kehadiranMap[m.id_mahasiswa]?.id_kehadiran || null,
      status_kehadiran: kehadiranMap[m.id_mahasiswa]?.status || null,
    }));

    res.json({ status: 'Sukses', data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data kehadiran.' });
  }
};

// 7. Tutup Presensi — Fasilitator menutup presensi kegiatan
const tutupPresensi = async (req, res) => {
  const { id } = req.params;

  try {
    if (req.user.role !== 'FASILITATOR') {
      return res.status(403).json({ message: 'Akses ditolak! Hanya fasilitator yang dapat menutup presensi.' });
    }

    const kegiatan = await prisma.kegiatanPembinaan.findUnique({
      where: { id_kegiatan: Number(id) }
    });
    if (!kegiatan) {
      return res.status(404).json({ message: 'Kegiatan tidak ditemukan.' });
    }
    if (kegiatan.status_kegiatan === 'SELESAI') {
      return res.status(400).json({ message: 'Presensi kegiatan ini sudah ditutup sebelumnya.' });
    }

    // 1. Update status kegiatan → SELESAI
    await prisma.kegiatanPembinaan.update({
      where: { id_kegiatan: Number(id) },
      data: { status_kegiatan: 'SELESAI' },
    });



    // Emit realtime event ke semua client
    try { getIO().emit("kegiatan:update", { message: "Presensi ditutup" }); } catch (_) {}

    res.json({
      status: 'Sukses',
      message: 'Presensi kegiatan berhasil ditutup.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat menutup presensi.' });
  }
};

// 8. Fasilitator membuat kehadiran baru (mahasiswa belum diisi)
const buatKehadiranFasil = async (req, res) => {
  const { id_kegiatan, id_mahasiswa, status_kehadiran } = req.body;

  try {
    if (req.user.role !== 'FASILITATOR') {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    if (!id_kegiatan || !id_mahasiswa || !status_kehadiran) {
      return res.status(400).json({ message: 'Field id_kegiatan, id_mahasiswa, dan status_kehadiran wajib diisi.' });
    }

    // Cek kegiatan ada
    const kegiatan = await prisma.kegiatanPembinaan.findUnique({
      where: { id_kegiatan: Number(id_kegiatan) }
    });
    if (!kegiatan) return res.status(404).json({ message: 'Kegiatan tidak ditemukan.' });

    const kehadiran = await prisma.kehadiran.create({
      data: {
        id_kegiatan: Number(id_kegiatan),
        id_mahasiswa: Number(id_mahasiswa),
        status_kehadiran: status_kehadiran,
      }
    });

    // Emit realtime event ke semua client
    try { getIO().emit("absensi:update", { message: "Kehadiran fasil ditambah" }); } catch (_) {}

    res.status(201).json({ status: 'Sukses', message: 'Kehadiran berhasil ditambahkan.', data: kehadiran });
  } catch (error) {
    console.error('buatKehadiranFasil error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Data kehadiran mahasiswa ini sudah ada. Gunakan edit (PUT).' });
    }
    res.status(500).json({ message: 'Gagal menyimpan kehadiran.' });
  }
};

// 9. Fasilitator mengedit kehadiran yang sudah ada
const editKehadiranFasil = async (req, res) => {
  const { id } = req.params;
  const { status_kehadiran } = req.body;

  try {
    if (req.user.role !== 'FASILITATOR') {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    if (!status_kehadiran) {
      return res.status(400).json({ message: 'Field status_kehadiran wajib diisi.' });
    }

    // Cek kehadiran ada
    const existing = await prisma.kehadiran.findUnique({
      where: { id_kehadiran: Number(id) }
    });
    if (!existing) return res.status(404).json({ message: 'Data kehadiran tidak ditemukan.' });

    const updated = await prisma.kehadiran.update({
      where: { id_kehadiran: Number(id) },
      data: { status_kehadiran }
    });

    // Emit realtime event ke semua client
    try { getIO().emit("absensi:update", { message: "Kehadiran fasil diedit" }); } catch (_) {}

    res.json({ status: 'Sukses', message: 'Kehadiran berhasil diperbarui.', data: updated });
  } catch (error) {
    console.error('editKehadiranFasil error:', error);
    res.status(500).json({ message: 'Gagal mengubah data kehadiran.' });
  }
};

// 10. Cek Kelengkapan Absensi sebelum Tutup Presensi
const cekKelengkapanAbsensi = async (req, res) => {
  const { id } = req.params;
  try {
    const kegiatan = await prisma.kegiatanPembinaan.findUnique({
      where: { id_kegiatan: Number(id) },
      select: { id_gedung: true }
    });
    if (!kegiatan) return res.status(404).json({ message: 'Kegiatan tidak ditemukan.' });

    const mahasiswaList = await prisma.mahasiswa.findMany({
      where: { id_gedung: kegiatan.id_gedung, status_hunian: 'AKTIF' },
      select: { id_mahasiswa: true, lantai: true, nomor_kamar: true }
    });

    const kehadiranList = await prisma.kehadiran.findMany({
      where: { id_kegiatan: Number(id) },
      select: { id_mahasiswa: true }
    });
    const kehadiranSet = new Set(kehadiranList.map(k => k.id_mahasiswa));

    const SLOT_OPTIONS = ['1-A', '1-B', '2-A', '2-B', '3-A', '3-B', '4-A', '4-B', '5-A', '5-B'];
    const blokMap = {};
    SLOT_OPTIONS.forEach(slot => {
      const [lantaiStr, blok] = slot.split('-');
      blokMap[slot] = { lantai: Number(lantaiStr), blok, total: 0, terisi: 0, lengkap: true };
    });

    mahasiswaList.forEach(m => {
      const lantai = m.lantai;
      const blok = m.nomor_kamar ? m.nomor_kamar[0].toUpperCase() : '';
      const key = `${lantai}-${blok}`;
      if (blokMap[key]) {
        blokMap[key].total += 1;
        if (kehadiranSet.has(m.id_mahasiswa)) {
          blokMap[key].terisi += 1;
        }
      }
    });

    const perBlokArray = Object.values(blokMap).map(b => {
      b.lengkap = b.total === 0 ? true : b.terisi >= b.total;
      return b;
    });

    perBlokArray.sort((a, b) => (a.lantai - b.lantai) || a.blok.localeCompare(b.blok));

    res.json({
      status: 'Sukses',
      data: perBlokArray
    });
  } catch (error) {
    console.error('cekKelengkapanAbsensi error:', error);
    res.status(500).json({ message: 'Gagal mengecek kelengkapan absensi.' });
  }
};

// ── Alfa Otomatis: isi ALPHA untuk mahasiswa yang belum tercatat ──────────────
const alfaOtomatis = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.role !== 'FASILITATOR') {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    // Ambil fasilitator & gedung
    const fasilitator = await prisma.fasilitator.findUnique({
      where: { id_fasilitator: req.user.id }
    });

    // Ambil semua mahasiswa aktif di gedung
    const semuaMhs = await prisma.mahasiswa.findMany({
      where: { id_gedung: fasilitator.id_gedung, status_hunian: 'AKTIF' },
      select: { id_mahasiswa: true }
    });

    // Ambil mahasiswa yang sudah punya record kehadiran di kegiatan ini
    const sudahAda = await prisma.kehadiran.findMany({
      where: { id_kegiatan: Number(id) },
      select: { id_mahasiswa: true }
    });
    const sudahAda_ids = new Set(sudahAda.map(k => k.id_mahasiswa));

    // Mahasiswa yang belum ada record → buat ALPHA
    const belumTercatat = semuaMhs.filter(m => !sudahAda_ids.has(m.id_mahasiswa));

    if (belumTercatat.length === 0) {
      return res.json({ status: 'Sukses', message: 'Semua mahasiswa sudah tercatat.', jumlah: 0 });
    }

    await prisma.kehadiran.createMany({
      data: belumTercatat.map(m => ({
        id_kegiatan: Number(id),
        id_mahasiswa: m.id_mahasiswa,
        status_kehadiran: 'ALPHA',
      }))
    });

    res.json({
      status: 'Sukses',
      message: `${belumTercatat.length} mahasiswa otomatis tercatat Alfa.`,
      jumlah: belumTercatat.length
    });
  } catch (error) {
    console.error('alfaOtomatis error:', error);
    res.status(500).json({ message: 'Gagal menjalankan alfa otomatis.' });
  }
};

// ── GET /api/kegiatan/:id/qr-token (FASILITATOR only) ────────────────────────
const getQrToken = async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.role !== 'FASILITATOR') {
      return res.status(403).json({ message: 'Akses ditolak! Hanya fasilitator.' });
    }

    await ensureQrColumns();

    // Gunakan raw SQL agar tidak bergantung prisma generate
    const rows = await prisma.$queryRawUnsafe(
      `SELECT id_kegiatan, nama_kegiatan, waktu_mulai, waktu_selesai, qr_token, qr_expires_at
       FROM kegiatan_pembinaan WHERE id_kegiatan = ?`,
      Number(id)
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Kegiatan tidak ditemukan.' });
    }

    const kegiatan = rows[0];

    // Generate token jika belum ada (kegiatan lama)
    if (!kegiatan.qr_token) {
      const newToken = randomUUID();
      await prisma.$executeRawUnsafe(
        `UPDATE kegiatan_pembinaan SET qr_token = ? WHERE id_kegiatan = ?`,
        newToken, Number(id)
      );
      kegiatan.qr_token = newToken;
    }

    return res.json({
      status: 'Sukses',
      data: {
        qr_token: kegiatan.qr_token,
        expires_at: kegiatan.qr_expires_at,
        nama_kegiatan: kegiatan.nama_kegiatan,
        waktu_mulai: kegiatan.waktu_mulai,
        waktu_selesai: kegiatan.waktu_selesai,
      }
    });
  } catch (error) {
    console.error('getQrToken error:', error);
    res.status(500).json({ message: 'Gagal mengambil QR token.' });
  }
};


// ── POST /api/kegiatan/scan-qr (MAHASISWA only) ───────────────────────────────
const scanQr = async (req, res) => {
  const { qr_token } = req.body;
  try {
    if (req.user.role !== 'MAHASISWA') {
      return res.status(403).json({ message: 'Akses ditolak! Hanya mahasiswa.' });
    }

    await ensureQrColumns();

    if (!qr_token) {
      return res.status(400).json({ message: 'qr_token wajib diisi.' });
    }

    // a. Cari kegiatan berdasarkan qr_token (raw SQL)
    const kRows = await prisma.$queryRawUnsafe(
      `SELECT id_kegiatan, nama_kegiatan, qr_expires_at, status_kegiatan, id_gedung
       FROM kegiatan_pembinaan WHERE qr_token = ?`,
      qr_token
    );

    if (!kRows || kRows.length === 0) {
      return res.status(404).json({ message: 'QR Code tidak valid atau kegiatan tidak ditemukan.' });
    }

    const kegiatan = kRows[0];

    // b. Cek apakah QR sudah expired (langsung tutup presensi tanpa tunggu cron)
    const now = new Date();
    if (kegiatan.qr_expires_at && now > new Date(kegiatan.qr_expires_at)) {
      // Langsung tutup presensi jika belum di-SELESAI (tidak tunggu cron)
      if (kegiatan.status_kegiatan === 'BERLANGSUNG') {
        await prisma.kegiatanPembinaan.update({
          where: { id_kegiatan: kegiatan.id_kegiatan },
          data: { status_kegiatan: 'SELESAI' }
        });
        try { getIO().emit("kegiatan:update", { message: "Presensi otomatis ditutup" }); } catch (_) {}
      }
      return res.status(400).json({ message: 'QR Code sudah expired. Waktu absensi telah habis.' });
    }

    // Cek kegiatan masih berlangsung
    if (kegiatan.status_kegiatan === 'SELESAI') {
      return res.status(400).json({ message: 'Presensi kegiatan ini sudah ditutup.' });
    }

    const id_mahasiswa = req.user.id;

    // Validasi mahasiswa terdaftar di gedung yang sama
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { id_mahasiswa },
      select: { id_gedung: true, status_hunian: true }
    });
    if (!mahasiswa || mahasiswa.status_hunian !== 'AKTIF') {
      return res.status(403).json({ message: 'Data mahasiswa tidak valid atau tidak aktif.' });
    }
    if (mahasiswa.id_gedung !== kegiatan.id_gedung) {
      return res.status(403).json({ message: 'Kamu bukan mahasiswa di gedung penyelenggara kegiatan ini.' });
    }

    // c. Cek apakah mahasiswa sudah absen sebelumnya
    const existing = await prisma.kehadiran.findFirst({
      where: { id_kegiatan: kegiatan.id_kegiatan, id_mahasiswa }
    });
    if (existing) {
      return res.status(400).json({ message: 'Kamu sudah absen untuk kegiatan ini.' });
    }

    // d. Insert kehadiran HADIR
    const waktu_hadir = new Date();
    await prisma.kehadiran.create({
      data: {
        id_kegiatan: kegiatan.id_kegiatan,
        id_mahasiswa,
        status_kehadiran: 'HADIR',
        waktu_absen: waktu_hadir,
      }
    });

    // Emit realtime event ke semua client (update QR modal di fasilitator)
    try { getIO().emit("absensi:update", { message: "Mahasiswa scan QR berhasil" }); } catch (_) {}

    return res.status(201).json({
      status: 'Sukses',
      message: 'Berhasil! Kehadiran kamu telah tercatat.',
      data: {
        nama_kegiatan: kegiatan.nama_kegiatan,
        waktu_hadir: waktu_hadir.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }
    });
  } catch (error) {
    console.error('scanQr error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server saat memproses absensi QR.' });
  }
};

module.exports = {
  buatKegiatan,
  getDaftarKegiatan,
  getMahasiswaAsrama,
  editKegiatan,
  hapusKegiatan,
  getKehadiranPerBlok,
  tutupPresensi,
  buatKehadiranFasil,
  editKehadiranFasil,
  cekKelengkapanAbsensi,
  alfaOtomatis,
  getQrToken,
  scanQr,
  cekKegiatanAktif,
};

// ── Cek kegiatan aktif (BERLANGSUNG) di asrama fasilitator ─────────────────────
/**
 * GET /api/kegiatan/cek-aktif
 * Response: { ada: boolean, kegiatan: { id_kegiatan, nama_kegiatan, created_at } | null }
 */
async function cekKegiatanAktif(req, res) {
  try {
    if (req.user.role !== 'FASILITATOR') {
      return res.status(403).json({ message: 'Akses ditolak.' });
    }

    const fasilitator = await prisma.fasilitator.findUnique({
      where: { id_fasilitator: req.user.id },
      select: { id_gedung: true },
    });
    if (!fasilitator) {
      return res.status(404).json({ message: 'Data fasilitator tidak ditemukan.' });
    }

    const kegiatanAktif = await prisma.kegiatanPembinaan.findFirst({
      where: {
        id_gedung: fasilitator.id_gedung,
        status_kegiatan: 'BERLANGSUNG',
      },
      select: {
        id_kegiatan: true,
        nama_kegiatan: true,
        created_at: true,
        jenis_kegiatan: { select: { nama_jenis: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.json({
      status: 'Sukses',
      ada: !!kegiatanAktif,
      kegiatan: kegiatanAktif ?? null,
    });
  } catch (error) {
    console.error('cekKegiatanAktif error:', error);
    res.status(500).json({ message: 'Gagal memeriksa kegiatan aktif.' });
  }
}
