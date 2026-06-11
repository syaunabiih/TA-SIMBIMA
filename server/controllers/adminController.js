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
        fakultas: { select: { nama: true } },
        jurusan: { select: { nama: true } },
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

    // 7. Tren kehadiran global — 8 kegiatan terakhir (semua gedung, HANYA kegiatan wajib, berurut)
    // Karena 1 kegiatan = 1 gedung, kita harus group berdasarkan tanggal_kegiatan dan jenis_kegiatan
    const recentGroupsRaw = await prisma.kegiatanPembinaan.findMany({
      where: {
        tanggal_kegiatan: { lte: new Date() },
        jenis_kegiatan: { is_wajib: true }
      },
      select: {
        tanggal_kegiatan: true,
        id_jenis_kegiatan: true,
        jenis_kegiatan: { select: { nama_jenis: true } }
      },
      orderBy: { tanggal_kegiatan: 'desc' },
      distinct: ['tanggal_kegiatan', 'id_jenis_kegiatan'],
      take: 8
    });

    const formatTgl = (d) =>
      new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

    const tren_kehadiran_global = await Promise.all(
      recentGroupsRaw.map(async (group) => {
        const kegiatans = await prisma.kegiatanPembinaan.findMany({
          where: {
            tanggal_kegiatan: group.tanggal_kegiatan,
            id_jenis_kegiatan: group.id_jenis_kegiatan
          },
          include: {
            kehadirans: { select: { status_kehadiran: true } }
          }
        });

        let hadir = 0, alpha = 0, izin = 0, sakit = 0;
        kegiatans.forEach(k => {
          k.kehadirans.forEach(ab => {
            if (ab.status_kehadiran === "HADIR") hadir++;
            else if (ab.status_kehadiran === "ALPHA") alpha++;
            else if (ab.status_kehadiran === "IZIN") izin++;
            else if (ab.status_kehadiran === "SAKIT") sakit++;
          });
        });

        const namaShort = group.jenis_kegiatan.nama_jenis.length > 16
          ? group.jenis_kegiatan.nama_jenis.substring(0, 15) + "…"
          : group.jenis_kegiatan.nama_jenis;

        return {
          id: `${group.tanggal_kegiatan.toISOString()}-${group.id_jenis_kegiatan}`,
          label: namaShort,
          tanggal: formatTgl(group.tanggal_kegiatan),
          hadir,
          alpha,
          izin,
          sakit,
        };
      })
    );

    // Balik urutan agar kronologis (dari kiri ke kanan di chart)
    tren_kehadiran_global.reverse();

    // 8. Total gedung
    const totalGedung = await prisma.gedung.count();

    res.json({
      status: "Sukses",
      message: "Dashboard stats berhasil diambil",
      data: {
        totalMahasiswa,
        totalFasilitator,
        totalKegiatan,
        totalGedung,
        rataRataKehadiran,
        mahasiswaAlfaTerbanyak,
        tren_kehadiran_global,
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
 * GET /api/admin/dashboard/kehadiran-per-gedung
 * Return persentase kehadiran per asrama
 */
const getKehadiranPerGedung = async (req, res) => {
  try {
    const gedungAll = await prisma.gedung.findMany({
      select: { id_gedung: true, nama_gedung: true },
    });

    const hasil = [];

    for (const g of gedungAll) {
      // Ambil absensi HANYA dari mahasiswa yang status_hunian = "AKTIF"
      const absensiGedung = await prisma.kehadiran.findMany({
        where: {
          kegiatan: { id_gedung: g.id_gedung },
          mahasiswa: { status_hunian: "AKTIF" },
        },
        select: { status_kehadiran: true },
      });

      const total = absensiGedung.length;
      const hadir = absensiGedung.filter((a) => a.status_kehadiran === "HADIR").length;

      const persentase = total > 0 ? parseFloat(((hadir / total) * 100).toFixed(1)) : 0;

      hasil.push({
        gedung: g.nama_gedung,
        persentase,
        hadir,
        total,
      });
    }

    // Urutkan berdasarkan persentase tertinggi
    hasil.sort((a, b) => b.persentase - a.persentase);

    res.json(hasil);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal mengambil data kehadiran per gedung." });
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
  const { nama_gedung, kode_gedung, jumlah_lantai, kapasitas_mahasiswa, status_gedung } = req.body;

  if (!nama_gedung || !kode_gedung || !jumlah_lantai || !kapasitas_mahasiswa) {
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
  const { nama_gedung, kode_gedung, jumlah_lantai, kapasitas_mahasiswa, status_gedung } = req.body;

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
    const list = await prisma.tahunAkademik.findMany({ orderBy: [{ nama: 'desc' }] });
    res.json({ status: 'Sukses', data: list });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data tahun akademik.' });
  }
};

const tambahTahunAkademik = async (req, res) => {
  const { nama, is_aktif } = req.body;
  if (!nama) {
    return res.status(400).json({ message: 'Field wajib: nama.' });
  }
  try {
    const exist = await prisma.tahunAkademik.findUnique({ where: { nama } });
    if (exist) return res.status(409).json({ message: 'Tahun akademik tersebut sudah ada.' });

    if (is_aktif) {
      const activeTA = await prisma.tahunAkademik.findFirst({ where: { is_aktif: true } });
      if (activeTA) {
        return res.status(400).json({ message: 'Silahkan nonaktif tahun akademik yang sedang aktif terlebih dahulu.' });
      }
    }

    const data = await prisma.tahunAkademik.create({ data: { nama, is_aktif: is_aktif || false } });
    res.status(201).json({ status: 'Sukses', message: 'Tahun akademik berhasil ditambahkan.', data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menambahkan tahun akademik.' });
  }
};

const editTahunAkademik = async (req, res) => {
  const id = Number(req.params.id);
  const { nama, is_aktif } = req.body;
  try {
    const exist = await prisma.tahunAkademik.findUnique({ where: { id_tahun: id } });
    if (!exist) return res.status(404).json({ message: 'Tahun akademik tidak ditemukan.' });

    const updateData = {};
    if (nama) updateData.nama = nama;
    
    if (is_aktif !== undefined && is_aktif !== exist.is_aktif) {
      if (is_aktif === true) {
        const activeTA = await prisma.tahunAkademik.findFirst({ where: { is_aktif: true } });
        if (activeTA && activeTA.id_tahun !== id) {
          return res.status(400).json({ message: 'Silahkan nonaktif tahun akademik yang sedang aktif terlebih dahulu.' });
        }
      }
      updateData.is_aktif = is_aktif;
    }

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
    res.json({ status: 'Sukses', message: `Tahun akademik "${exist.nama}" berhasil dihapus.` });
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

    res.json({ status: 'Sukses', message: `"${updated.nama}" sekarang menjadi tahun akademik aktif.`, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengaktifkan tahun akademik.' });
  }
};

const setNonaktifTahunAkademik = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const exist = await prisma.tahunAkademik.findUnique({ where: { id_tahun: id } });
    if (!exist) return res.status(404).json({ message: 'Tahun akademik tidak ditemukan.' });

    const updated = await prisma.tahunAkademik.update({ where: { id_tahun: id }, data: { is_aktif: false } });

    res.json({ status: 'Sukses', message: `"${updated.nama}" berhasil dinonaktifkan.`, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menonaktifkan tahun akademik.' });
  }
};

// ============================================================
// FAKULTAS MANAGEMENT
// ============================================================
const getFakultasList = async (req, res) => {
  try {
    const list = await prisma.fakultas.findMany({ orderBy: { nama: 'asc' } });
    res.json({ status: 'Sukses', data: list });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data fakultas.' });
  }
};

const tambahFakultas = async (req, res) => {
  const { nama } = req.body;
  if (!nama) return res.status(400).json({ message: 'Nama fakultas wajib diisi.' });
  try {
    const exist = await prisma.fakultas.findUnique({ where: { nama } });
    if (exist) return res.status(409).json({ message: 'Fakultas sudah ada.' });
    const data = await prisma.fakultas.create({ data: { nama } });
    res.status(201).json({ status: 'Sukses', message: 'Fakultas berhasil ditambahkan.', data });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan fakultas.' });
  }
};

const editFakultas = async (req, res) => {
  const id = Number(req.params.id);
  const { nama } = req.body;
  if (!nama) return res.status(400).json({ message: 'Nama fakultas wajib diisi.' });
  try {
    const exist = await prisma.fakultas.findUnique({ where: { nama } });
    if (exist && exist.id_fakultas !== id) return res.status(409).json({ message: 'Fakultas sudah ada.' });
    const updated = await prisma.fakultas.update({ where: { id_fakultas: id }, data: { nama } });
    res.json({ status: 'Sukses', message: 'Fakultas berhasil diperbarui.', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui fakultas.' });
  }
};

const hapusFakultas = async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.fakultas.delete({ where: { id_fakultas: id } });
    res.json({ status: 'Sukses', message: 'Fakultas berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus fakultas. Pastikan tidak ada data yang terkait.' });
  }
};

// ============================================================
// JURUSAN MANAGEMENT
// ============================================================
const getJurusanList = async (req, res) => {
  try {
    const list = await prisma.jurusan.findMany({ include: { fakultas: true }, orderBy: { nama: 'asc' } });
    res.json({ status: 'Sukses', data: list });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data jurusan.' });
  }
};

const tambahJurusan = async (req, res) => {
  const { nama, id_fakultas } = req.body;
  if (!nama || !id_fakultas) return res.status(400).json({ message: 'Nama dan Fakultas wajib diisi.' });
  try {
    const data = await prisma.jurusan.create({ data: { nama, id_fakultas: Number(id_fakultas) } });
    res.status(201).json({ status: 'Sukses', message: 'Jurusan berhasil ditambahkan.', data });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan jurusan.' });
  }
};

const editJurusan = async (req, res) => {
  const id = Number(req.params.id);
  const { nama, id_fakultas } = req.body;
  if (!nama || !id_fakultas) return res.status(400).json({ message: 'Nama dan Fakultas wajib diisi.' });
  try {
    const updated = await prisma.jurusan.update({ where: { id_jurusan: id }, data: { nama, id_fakultas: Number(id_fakultas) } });
    res.json({ status: 'Sukses', message: 'Jurusan berhasil diperbarui.', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui jurusan.' });
  }
};

const hapusJurusan = async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.jurusan.delete({ where: { id_jurusan: id } });
    res.json({ status: 'Sukses', message: 'Jurusan berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus jurusan. Pastikan tidak ada data yang terkait.' });
  }
};

// ============================================================
// JENIS KEGIATAN MANAGEMENT
// ============================================================
const getJenisKegiatanList = async (req, res) => {
  try {
    const list = await prisma.jenisKegiatan.findMany({ orderBy: { id_jenis_kegiatan: 'asc' } });
    res.json({ status: 'Sukses', data: list });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data jenis kegiatan.' });
  }
};

const tambahJenisKegiatan = async (req, res) => {
  const { nama_jenis, is_wajib } = req.body;
  if (!nama_jenis) return res.status(400).json({ message: 'Nama jenis kegiatan wajib diisi.' });
  try {
    const exist = await prisma.jenisKegiatan.findUnique({ where: { nama_jenis } });
    if (exist) return res.status(409).json({ message: 'Jenis kegiatan sudah ada.' });
    const data = await prisma.jenisKegiatan.create({ data: { nama_jenis, is_wajib: is_wajib || false } });
    res.status(201).json({ status: 'Sukses', message: 'Jenis kegiatan berhasil ditambahkan.', data });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menambahkan jenis kegiatan.' });
  }
};

const editJenisKegiatan = async (req, res) => {
  const id = Number(req.params.id);
  const { nama_jenis, is_wajib } = req.body;
  if (!nama_jenis) return res.status(400).json({ message: 'Nama jenis kegiatan wajib diisi.' });
  try {
    const exist = await prisma.jenisKegiatan.findUnique({ where: { nama_jenis } });
    if (exist && exist.id_jenis_kegiatan !== id) return res.status(409).json({ message: 'Jenis kegiatan sudah ada.' });
    const updated = await prisma.jenisKegiatan.update({ where: { id_jenis_kegiatan: id }, data: { nama_jenis, is_wajib: is_wajib || false } });
    res.json({ status: 'Sukses', message: 'Jenis kegiatan berhasil diperbarui.', data: updated });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memperbarui jenis kegiatan.' });
  }
};

const hapusJenisKegiatan = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const count = await prisma.kegiatanPembinaan.count({ where: { id_jenis_kegiatan: id } });
    if (count > 0) return res.status(409).json({ message: 'Tidak dapat menghapus, jenis kegiatan ini sudah digunakan.' });
    await prisma.jenisKegiatan.delete({ where: { id_jenis_kegiatan: id } });
    res.json({ status: 'Sukses', message: 'Jenis kegiatan berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus jenis kegiatan.' });
  }
};

module.exports = {
  getFasilitatorList,
  tambahFasilitator,
  editFasilitator,
  hapusFasilitator,
  getMahasiswaList,
  getDashboardStats,
  getKehadiranPerGedung,
  getGedungList,
  tambahGedung,
  editGedung,
  hapusGedung,
  getTahunAkademik,
  tambahTahunAkademik,
  editTahunAkademik,
  hapusTahunAkademik,
  setAktifTahunAkademik,
  setNonaktifTahunAkademik,
  getFakultasList,
  tambahFakultas,
  editFakultas,
  hapusFakultas,
  getJurusanList,
  tambahJurusan,
  editJurusan,
  hapusJurusan,
  getJenisKegiatanList,
  tambahJenisKegiatan,
  editJenisKegiatan,
  hapusJenisKegiatan,
};



