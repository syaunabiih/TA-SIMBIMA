const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// ============================================================
// FASILITATOR MANAGEMENT
// ============================================================

/**
 * GET /api/admin/fasilitator
 * List semua akun fasilitator beserta nama gedung
 */
const getFasilitatorList = async (req, res) => {
  try {
    const fasilitators = await prisma.fasilitator.findMany({
      select: {
        id_fasilitator: true,
        nip: true,
        nama: true,
        email: true,
        no_telp: true,
        foto_profil: true,
        id_gedung: true,
        gedung: {
          select: {
            id_gedung: true,
            nama_gedung: true,
            kode_gedung: true,
          },
        },
        created_at: true,
      },
      orderBy: { id_gedung: "asc" },
    });

    res.json({
      status: "Sukses",
      message: "Data fasilitator berhasil diambil",
      data: fasilitators,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data fasilitator." });
  }
};

/**
 * POST /api/admin/fasilitator
 * Tambah akun fasilitator baru
 * Body: { nama, nip, email, password, id_gedung, no_telp? }
 */
const tambahFasilitator = async (req, res) => {
  const { nama, nip, email, password, id_gedung, no_telp } = req.body;

  if (!nama || !nip || !email || !password || !id_gedung) {
    return res.status(400).json({
      message: "Field wajib: nama, nip, email, password, id_gedung",
    });
  }

  try {
    // Cek duplikat
    const exist = await prisma.fasilitator.findFirst({
      where: { OR: [{ nip }, { email }] },
    });
    if (exist) {
      return res.status(409).json({ message: "NIP atau Email sudah terdaftar." });
    }

    // Cek gedung ada
    const gedung = await prisma.gedung.findUnique({ where: { id_gedung: Number(id_gedung) } });
    if (!gedung) {
      return res.status(404).json({ message: "Gedung tidak ditemukan." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const fasilitator = await prisma.fasilitator.create({
      data: {
        nip,
        nama,
        email,
        password: hashedPassword,
        no_telp: no_telp || null,
        id_gedung: Number(id_gedung),
      },
      select: {
        id_fasilitator: true,
        nip: true,
        nama: true,
        email: true,
        no_telp: true,
        id_gedung: true,
        gedung: { select: { nama_gedung: true, kode_gedung: true } },
        created_at: true,
      },
    });

    res.status(201).json({
      status: "Sukses",
      message: "Fasilitator berhasil ditambahkan",
      data: fasilitator,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menambahkan fasilitator." });
  }
};

/**
 * PUT /api/admin/fasilitator/:id
 * Edit data fasilitator (nama, email, no_telp, id_gedung, password opsional)
 */
const editFasilitator = async (req, res) => {
  const id = Number(req.params.id);
  const { nama, email, no_telp, id_gedung, password } = req.body;

  try {
    const exist = await prisma.fasilitator.findUnique({ where: { id_fasilitator: id } });
    if (!exist) {
      return res.status(404).json({ message: "Fasilitator tidak ditemukan." });
    }

    const updateData = {};
    if (nama) updateData.nama = nama;
    if (email) updateData.email = email;
    if (no_telp !== undefined) updateData.no_telp = no_telp;
    if (id_gedung) updateData.id_gedung = Number(id_gedung);
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updated = await prisma.fasilitator.update({
      where: { id_fasilitator: id },
      data: updateData,
      select: {
        id_fasilitator: true,
        nip: true,
        nama: true,
        email: true,
        no_telp: true,
        id_gedung: true,
        gedung: { select: { nama_gedung: true, kode_gedung: true } },
        updated_at: true,
      },
    });

    res.json({
      status: "Sukses",
      message: "Data fasilitator berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memperbarui fasilitator." });
  }
};

/**
 * DELETE /api/admin/fasilitator/:id
 * Hapus fasilitator — cek dulu tidak ada kegiatan BERLANGSUNG
 */
const hapusFasilitator = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const exist = await prisma.fasilitator.findUnique({ where: { id_fasilitator: id } });
    if (!exist) {
      return res.status(404).json({ message: "Fasilitator tidak ditemukan." });
    }

    // Cek kegiatan aktif
    const kegiatanAktif = await prisma.kegiatanPembinaan.findFirst({
      where: {
        id_fasilitator: id,
        status_kegiatan: "BERLANGSUNG",
      },
    });

    if (kegiatanAktif) {
      return res.status(409).json({
        message:
          "Fasilitator tidak bisa dihapus karena masih memiliki kegiatan aktif yang sedang berlangsung.",
        kegiatan: kegiatanAktif.nama_kegiatan,
      });
    }

    await prisma.fasilitator.delete({ where: { id_fasilitator: id } });

    res.json({
      status: "Sukses",
      message: `Fasilitator "${exist.nama}" berhasil dihapus.`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menghapus fasilitator." });
  }
};

// ============================================================
// MAHASISWA MANAGEMENT
// ============================================================

/**
 * GET /api/admin/mahasiswa
 * List semua mahasiswa (sudah tersedia di mahasiswaRoutes, tapi tambahkan versi admin yang lebih lengkap)
 */
const getMahasiswaList = async (req, res) => {
  try {
    const { gedung, status } = req.query;
    const where = {};
    if (gedung) where.id_gedung = Number(gedung);
    if (status) where.status_hunian = status;

    const mahasiswas = await prisma.mahasiswa.findMany({
      where,
      select: {
        id_mahasiswa: true,
        nim: true,
        nama: true,
        email: true,
        lantai: true,
        nomor_kamar: true,
        no_telp: true,
        status_hunian: true,
        status_reward: true,
        kuota_izin_pulang: true,
        id_gedung: true,
        gedung: { select: { nama_gedung: true, kode_gedung: true } },
        created_at: true,
      },
      orderBy: [{ id_gedung: "asc" }, { lantai: "asc" }, { nomor_kamar: "asc" }],
    });

    res.json({
      status: "Sukses",
      message: "Data mahasiswa berhasil diambil",
      total: mahasiswas.length,
      data: mahasiswas,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data mahasiswa." });
  }
};

/**
 * POST /api/admin/mahasiswa
 * Tambah akun mahasiswa baru
 * Body: { nama, nim, email, lantai, nomor_kamar, id_gedung, password, no_telp? }
 */
const tambahMahasiswa = async (req, res) => {
  const { nama, nim, email, lantai, nomor_kamar, id_gedung, password, no_telp } = req.body;

  if (!nama || !nim || !email || !lantai || !nomor_kamar || !id_gedung || !password) {
    return res.status(400).json({
      message: "Field wajib: nama, nim, email, lantai, nomor_kamar, id_gedung, password",
    });
  }

  try {
    const existNim = await prisma.mahasiswa.findUnique({ where: { nim } });
    if (existNim) return res.status(409).json({ message: "NIM sudah terdaftar." });

    const existEmail = await prisma.mahasiswa.findUnique({ where: { email } });
    if (existEmail) return res.status(409).json({ message: "Email sudah terdaftar." });

    const gedung = await prisma.gedung.findUnique({ where: { id_gedung: Number(id_gedung) } });
    if (!gedung) return res.status(404).json({ message: "Gedung tidak ditemukan." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const mahasiswa = await prisma.mahasiswa.create({
      data: {
        nim,
        nama,
        email,
        password: hashedPassword,
        lantai: Number(lantai),
        nomor_kamar,
        no_telp: no_telp || null,
        id_gedung: Number(id_gedung),
      },
      select: {
        id_mahasiswa: true,
        nim: true,
        nama: true,
        email: true,
        lantai: true,
        nomor_kamar: true,
        id_gedung: true,
        gedung: { select: { nama_gedung: true, kode_gedung: true } },
        created_at: true,
      },
    });

    res.status(201).json({
      status: "Sukses",
      message: "Mahasiswa berhasil ditambahkan",
      data: mahasiswa,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menambahkan mahasiswa." });
  }
};

/**
 * PUT /api/admin/mahasiswa/:id
 * Edit mahasiswa termasuk kamar
 */
const editMahasiswa = async (req, res) => {
  const id = Number(req.params.id);
  const { nama, email, no_telp, lantai, nomor_kamar, id_gedung, password, status_hunian } = req.body;

  try {
    const exist = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa: id } });
    if (!exist) return res.status(404).json({ message: "Mahasiswa tidak ditemukan." });

    const updateData = {};
    if (nama) updateData.nama = nama;
    if (email) updateData.email = email;
    if (no_telp !== undefined) updateData.no_telp = no_telp;
    if (lantai) updateData.lantai = Number(lantai);
    if (nomor_kamar) updateData.nomor_kamar = nomor_kamar;
    if (id_gedung) updateData.id_gedung = Number(id_gedung);
    if (status_hunian) updateData.status_hunian = status_hunian;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updated = await prisma.mahasiswa.update({
      where: { id_mahasiswa: id },
      data: updateData,
      select: {
        id_mahasiswa: true,
        nim: true,
        nama: true,
        email: true,
        lantai: true,
        nomor_kamar: true,
        status_hunian: true,
        id_gedung: true,
        gedung: { select: { nama_gedung: true, kode_gedung: true } },
        updated_at: true,
      },
    });

    res.json({
      status: "Sukses",
      message: "Data mahasiswa berhasil diperbarui",
      data: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memperbarui mahasiswa." });
  }
};

/**
 * DELETE /api/admin/mahasiswa/:id
 * Hapus mahasiswa
 */
const hapusMahasiswa = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const exist = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa: id } });
    if (!exist) return res.status(404).json({ message: "Mahasiswa tidak ditemukan." });

    await prisma.mahasiswa.delete({ where: { id_mahasiswa: id } });

    res.json({
      status: "Sukses",
      message: `Mahasiswa "${exist.nama}" berhasil dihapus.`,
    });
  } catch (error) {
    console.error(error);
    if (error.code === "P2003") {
      return res.status(409).json({
        message: "Mahasiswa tidak bisa dihapus karena masih memiliki data terkait (kehadiran/perizinan).",
      });
    }
    res.status(500).json({ message: "Gagal menghapus mahasiswa." });
  }
};

// ============================================================
// DASHBOARD STATS (GLOBAL — semua gedung)
// ============================================================

/**
 * GET /api/admin/dashboard-stats
 * Return:
 *   totalMahasiswa, totalFasilitator, totalKegiatan,
 *   rataRataKehadiran (semua blok),
 *   mahasiswaAlfaTerbanyak (top 5)
 */
const getDashboardStats = async (req, res) => {
  try {
    // 1. Total mahasiswa aktif
    const totalMahasiswa = await prisma.mahasiswa.count({
      where: { status_hunian: "AKTIF" },
    });

    // 2. Total fasilitator
    const totalFasilitator = await prisma.fasilitator.count();

    // 3. Total kegiatan
    const totalKegiatan = await prisma.kegiatanPembinaan.count();

    // 4. Rata-rata kehadiran global (semua kehadiran)
    const allKehadiran = await prisma.kehadiran.groupBy({
      by: ["status_kehadiran"],
      _count: { id_kehadiran: true },
    });

    const countMap = {};
    for (const row of allKehadiran) {
      countMap[row.status_kehadiran] = row._count.id_kehadiran;
    }
    const totalAbsensi =
      (countMap["HADIR"] || 0) +
      (countMap["IZIN"] || 0) +
      (countMap["SAKIT"] || 0) +
      (countMap["ALPHA"] || 0);

    const rataRataKehadiran =
      totalAbsensi > 0
        ? Math.round(((countMap["HADIR"] || 0) / totalAbsensi) * 10000) / 100
        : 0;

    // 5. Top 5 mahasiswa dengan alfa terbanyak
    const alfaRaw = await prisma.kehadiran.groupBy({
      by: ["id_mahasiswa"],
      where: { status_kehadiran: "ALPHA" },
      _count: { id_kehadiran: true },
      orderBy: { _count: { id_kehadiran: "desc" } },
      take: 5,
    });

    // Ambil nama mahasiswa
    const mahasiswaAlfaTerbanyak = await Promise.all(
      alfaRaw.map(async (a) => {
        const mhs = await prisma.mahasiswa.findUnique({
          where: { id_mahasiswa: a.id_mahasiswa },
          select: {
            id_mahasiswa: true,
            nama: true,
            nim: true,
            gedung: { select: { nama_gedung: true, kode_gedung: true } },
          },
        });
        return {
          ...mhs,
          total_alfa: a._count.id_kehadiran,
        };
      })
    );

    // 6. Distribusi per gedung
    const distribusiGedung = await prisma.gedung.findMany({
      select: {
        id_gedung: true,
        nama_gedung: true,
        kode_gedung: true,
        _count: {
          select: {
            mahasiswas: true,
            fasilitators: true,
            kegiatans: true,
          },
        },
      },
      orderBy: { kode_gedung: "asc" },
    });

    res.json({
      status: "Sukses",
      message: "Dashboard stats berhasil diambil",
      data: {
        totalMahasiswa,
        totalFasilitator,
        totalKegiatan,
        rataRataKehadiran,
        mahasiswaAlfaTerbanyak,
        distribusiGedung: distribusiGedung.map((g) => ({
          id_gedung: g.id_gedung,
          nama_gedung: g.nama_gedung,
          kode_gedung: g.kode_gedung,
          jumlahMahasiswa: g._count.mahasiswas,
          jumlahFasilitator: g._count.fasilitators,
          jumlahKegiatan: g._count.kegiatans,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil dashboard stats." });
  }
};

/**
 * GET /api/admin/gedung
 * List semua gedung (untuk dropdown pilih gedung saat tambah/edit fasilitator/mahasiswa)
 */
const getGedungList = async (req, res) => {
  try {
    const gedungs = await prisma.gedung.findMany({
      select: {
        id_gedung: true,
        nama_gedung: true,
        kode_gedung: true,
        status_gedung: true,
        jumlah_lantai: true,
        kapasitas_mahasiswa: true,
        _count: {
          select: { mahasiswas: true, fasilitators: true },
        },
      },
      orderBy: { kode_gedung: "asc" },
    });

    res.json({
      status: "Sukses",
      data: gedungs.map((g) => ({
        ...g,
        jumlahMahasiswa: g._count.mahasiswas,
        jumlahFasilitator: g._count.fasilitators,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data gedung." });
  }
};

/**
 * POST /api/admin/gedung
 * Tambah gedung baru
 */
const tambahGedung = async (req, res) => {
  const { nama_gedung, kode_gedung, alamat, jumlah_lantai, kapasitas_mahasiswa, status_gedung } = req.body;

  if (!nama_gedung || !kode_gedung || !alamat || !jumlah_lantai || !kapasitas_mahasiswa) {
    return res.status(400).json({ message: "Semua field wajib diisi (kecuali status_gedung bisa default)." });
  }

  try {
    const existKode = await prisma.gedung.findUnique({ where: { kode_gedung } });
    if (existKode) return res.status(409).json({ message: "Kode gedung sudah terdaftar." });

    const existNama = await prisma.gedung.findUnique({ where: { nama_gedung } });
    if (existNama) return res.status(409).json({ message: "Nama gedung sudah terdaftar." });

    const gedungBaru = await prisma.gedung.create({
      data: {
        nama_gedung,
        kode_gedung,
        alamat,
        jumlah_lantai: Number(jumlah_lantai),
        kapasitas_mahasiswa: Number(kapasitas_mahasiswa),
        status_gedung: status_gedung || "AKTIF",
      }
    });

    res.status(201).json({
      status: "Sukses",
      message: "Gedung berhasil ditambahkan",
      data: gedungBaru
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal menambahkan gedung." });
  }
};

/**
 * PUT /api/admin/gedung/:id
 * Edit gedung
 */
const editGedung = async (req, res) => {
  const id = Number(req.params.id);
  const { nama_gedung, kode_gedung, alamat, jumlah_lantai, kapasitas_mahasiswa, status_gedung } = req.body;

  try {
    const exist = await prisma.gedung.findUnique({ where: { id_gedung: id } });
    if (!exist) return res.status(404).json({ message: "Gedung tidak ditemukan." });

    if (kode_gedung && kode_gedung !== exist.kode_gedung) {
      const cekKode = await prisma.gedung.findUnique({ where: { kode_gedung } });
      if (cekKode) return res.status(409).json({ message: "Kode gedung sudah dipakai gedung lain." });
    }

    if (nama_gedung && nama_gedung !== exist.nama_gedung) {
      const cekNama = await prisma.gedung.findUnique({ where: { nama_gedung } });
      if (cekNama) return res.status(409).json({ message: "Nama gedung sudah dipakai gedung lain." });
    }

    const updateData = {};
    if (nama_gedung) updateData.nama_gedung = nama_gedung;
    if (kode_gedung) updateData.kode_gedung = kode_gedung;
    if (alamat) updateData.alamat = alamat;
    if (jumlah_lantai) updateData.jumlah_lantai = Number(jumlah_lantai);
    if (kapasitas_mahasiswa) updateData.kapasitas_mahasiswa = Number(kapasitas_mahasiswa);
    if (status_gedung) updateData.status_gedung = status_gedung;

    const updated = await prisma.gedung.update({
      where: { id_gedung: id },
      data: updateData
    });

    res.json({
      status: "Sukses",
      message: "Data gedung berhasil diperbarui",
      data: updated
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memperbarui gedung." });
  }
};

/**
 * DELETE /api/admin/gedung/:id
 * Hapus gedung (cek constraint)
 */
const hapusGedung = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const exist = await prisma.gedung.findUnique({
      where: { id_gedung: id },
      include: {
        _count: {
          select: { mahasiswas: true, fasilitators: true }
        }
      }
    });

    if (!exist) return res.status(404).json({ message: "Gedung tidak ditemukan." });

    if (exist._count.mahasiswas > 0 || exist._count.fasilitators > 0) {
      return res.status(409).json({ 
        message: `Gedung tidak bisa dihapus karena masih ada ${exist._count.mahasiswas} mahasiswa dan ${exist._count.fasilitators} fasilitator terdaftar di dalamnya.`
      });
    }

    await prisma.gedung.delete({ where: { id_gedung: id } });

    res.json({
      status: "Sukses",
      message: `Gedung "${exist.nama_gedung}" berhasil dihapus.`
    });
  } catch (error) {
    console.error(error);
    if (error.code === "P2003") {
      return res.status(409).json({ message: "Gedung tidak bisa dihapus karena masih memiliki data terkait (kegiatan/evaluasi)." });
    }
    res.status(500).json({ message: "Gagal menghapus gedung." });
  }
};

// ============================================================
// TAHUN AKADEMIK MANAGEMENT
// ============================================================

const getTahunAkademik = async (req, res) => {
  try {
    const list = await prisma.tahunAkademik.findMany({ orderBy: [{ nama: 'desc' }, { semester: 'asc' }] });
    res.json({ status: 'Sukses', data: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data tahun akademik.' });
  }
};

const tambahTahunAkademik = async (req, res) => {
  const { nama, semester } = req.body;
  if (!nama || !semester) {
    return res.status(400).json({ message: 'Field wajib: nama, semester.' });
  }
  try {
    const exist = await prisma.tahunAkademik.findFirst({ where: { nama, semester } });
    if (exist) return res.status(409).json({ message: 'Tahun akademik dengan nama dan semester tersebut sudah ada.' });

    const data = await prisma.tahunAkademik.create({ data: { nama, semester, is_aktif: false } });
    res.status(201).json({ status: 'Sukses', message: 'Tahun akademik berhasil ditambahkan.', data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menambahkan tahun akademik.' });
  }
};

const editTahunAkademik = async (req, res) => {
  const id = Number(req.params.id);
  const { nama, semester } = req.body;
  try {
    const exist = await prisma.tahunAkademik.findUnique({ where: { id_tahun: id } });
    if (!exist) return res.status(404).json({ message: 'Tahun akademik tidak ditemukan.' });

    const updateData = {};
    if (nama) updateData.nama = nama;
    if (semester) updateData.semester = semester;

    const updated = await prisma.tahunAkademik.update({ where: { id_tahun: id }, data: updateData });
    res.json({ status: 'Sukses', message: 'Tahun akademik berhasil diperbarui.', data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui tahun akademik.' });
  }
};

const hapusTahunAkademik = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const exist = await prisma.tahunAkademik.findUnique({ where: { id_tahun: id } });
    if (!exist) return res.status(404).json({ message: 'Tahun akademik tidak ditemukan.' });
    if (exist.is_aktif) {
      return res.status(409).json({ message: 'Tahun akademik yang sedang aktif tidak bisa dihapus. Nonaktifkan terlebih dahulu.' });
    }
    await prisma.tahunAkademik.delete({ where: { id_tahun: id } });
    res.json({ status: 'Sukses', message: `Tahun akademik "${exist.nama} ${exist.semester}" berhasil dihapus.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menghapus tahun akademik.' });
  }
};

const setAktifTahunAkademik = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const exist = await prisma.tahunAkademik.findUnique({ where: { id_tahun: id } });
    if (!exist) return res.status(404).json({ message: 'Tahun akademik tidak ditemukan.' });

    // Nonaktifkan semua dulu, lalu aktifkan yang dipilih
    await prisma.tahunAkademik.updateMany({ data: { is_aktif: false } });
    const updated = await prisma.tahunAkademik.update({ where: { id_tahun: id }, data: { is_aktif: true } });

    res.json({ status: 'Sukses', message: `"${updated.nama} ${updated.semester}" sekarang menjadi tahun akademik aktif.`, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengaktifkan tahun akademik.' });
  }
};

// ============================================================
// JENIS KEGIATAN MASTER MANAGEMENT
// ============================================================

const getJenisKegiatanMaster = async (req, res) => {
  try {
    const list = await prisma.jenisKegiatanMaster.findMany({ orderBy: { nama: 'asc' } });
    res.json({ status: 'Sukses', data: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data jenis kegiatan.' });
  }
};

const tambahJenisKegiatan = async (req, res) => {
  const { nama, kode, deskripsi, is_aktif } = req.body;
  if (!nama || !kode) {
    return res.status(400).json({ message: 'Field wajib: nama, kode.' });
  }
  try {
    const exist = await prisma.jenisKegiatanMaster.findUnique({ where: { kode } });
    if (exist) return res.status(409).json({ message: 'Kode jenis kegiatan sudah terdaftar.' });

    const data = await prisma.jenisKegiatanMaster.create({
      data: { nama, kode: kode.toUpperCase(), deskripsi: deskripsi || null, is_aktif: is_aktif !== false }
    });
    res.status(201).json({ status: 'Sukses', message: 'Jenis kegiatan berhasil ditambahkan.', data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menambahkan jenis kegiatan.' });
  }
};

const editJenisKegiatan = async (req, res) => {
  const id = Number(req.params.id);
  const { nama, deskripsi, is_aktif } = req.body;
  try {
    const exist = await prisma.jenisKegiatanMaster.findUnique({ where: { id } });
    if (!exist) return res.status(404).json({ message: 'Jenis kegiatan tidak ditemukan.' });

    const updateData = {};
    if (nama) updateData.nama = nama;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (is_aktif !== undefined) updateData.is_aktif = Boolean(is_aktif);

    const updated = await prisma.jenisKegiatanMaster.update({ where: { id }, data: updateData });
    res.json({ status: 'Sukses', message: 'Jenis kegiatan berhasil diperbarui.', data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui jenis kegiatan.' });
  }
};

const hapusJenisKegiatan = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const exist = await prisma.jenisKegiatanMaster.findUnique({ where: { id } });
    if (!exist) return res.status(404).json({ message: 'Jenis kegiatan tidak ditemukan.' });

    // Cek apakah kode ini dipakai di KegiatanPembinaan (enum check)
    const dipakai = await prisma.kegiatanPembinaan.findFirst({
      where: { jenis_kegiatan: exist.kode }
    });
    if (dipakai) {
      return res.status(409).json({
        message: `Jenis kegiatan "${exist.nama}" tidak bisa dihapus karena sudah digunakan di ${dipakai.nama_kegiatan} dan kemungkinan kegiatan lainnya.`
      });
    }

    await prisma.jenisKegiatanMaster.delete({ where: { id } });
    res.json({ status: 'Sukses', message: `Jenis kegiatan "${exist.nama}" berhasil dihapus.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menghapus jenis kegiatan.' });
  }
};

module.exports = {
  getFasilitatorList,
  tambahFasilitator,
  editFasilitator,
  hapusFasilitator,
  getMahasiswaList,
  tambahMahasiswa,
  editMahasiswa,
  hapusMahasiswa,
  getDashboardStats,
  getGedungList,
  tambahGedung,
  editGedung,
  hapusGedung,
  getTahunAkademik,
  tambahTahunAkademik,
  editTahunAkademik,
  hapusTahunAkademik,
  setAktifTahunAkademik,
  getJenisKegiatanMaster,
  tambahJenisKegiatan,
  editJenisKegiatan,
  hapusJenisKegiatan,
};
