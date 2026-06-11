const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 1. Menampilkan Data Dashboard Monitoring (Ketua Pokja)
const getDashboardStats = async (req, res) => {
  try {
    if (req.user.role !== "KETUA_POKJA") {
      return res.status(403).json({ message: "Akses ditolak! Hanya Ketua Pokja yang diizinkan." });
    }

    const now = new Date();
    const startBulan = new Date(now.getFullYear(), now.getMonth(), 1);
    const endBulan   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const formatTgl  = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const formatTglLong = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    // 1. Statistik dasar
    const [totalMahasiswa, totalKegiatan, totalIzinMenunggu, totalIzinDisetujui] = await Promise.all([
      prisma.mahasiswa.count({ where: { status_hunian: "AKTIF" } }),
      prisma.kegiatanPembinaan.count(),
      prisma.perizinan.count({ where: { status_pengajuan: "MENUNGGU" } }),
      prisma.perizinan.count({ where: { status_pengajuan: "DISETUJUI" } }),
    ]);

    // 2. Tren kehadiran — ambil kegiatan WAJIB 60 hari terakhir lalu group per tanggal
    //    agar setiap titik chart = 1 hari (semua gedung digabung) → kurva mulus
    const kegiatanWajib = await prisma.kegiatanPembinaan.findMany({
      where: {
        tanggal_kegiatan: { lte: now },
        jenis_kegiatan: { is_wajib: true }
      },
      orderBy: { tanggal_kegiatan: 'asc' },
      include: {
        kehadirans: { select: { status_kehadiran: true } }
      }
    });

    // Group per tanggal (gabungkan semua gedung)
    const tglMap = {};
    kegiatanWajib.forEach(k => {
      const tglKey = new Date(k.tanggal_kegiatan).toISOString().split('T')[0];
      if (!tglMap[tglKey]) tglMap[tglKey] = { hadir: 0, alpha: 0, izin: 0, sakit: 0 };
      k.kehadirans.forEach(ab => {
        if (ab.status_kehadiran === 'HADIR')       tglMap[tglKey].hadir++;
        else if (ab.status_kehadiran === 'ALPHA')  tglMap[tglKey].alpha++;
        else if (ab.status_kehadiran === 'IZIN')   tglMap[tglKey].izin++;
        else if (ab.status_kehadiran === 'SAKIT')  tglMap[tglKey].sakit++;
      });
    });

    // Ambil 10 tanggal terakhir (sudah urut asc dari query)
    const tgl10 = Object.entries(tglMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10);

    const tren_kehadiran = tgl10.map(([tglKey, counts]) => {
      const { hadir, alpha, izin, sakit } = counts;
      const total = hadir + alpha + izin + sakit;
      const pct = (v) => total > 0 ? parseFloat(((v / total) * 100).toFixed(1)) : 0;
      const d = new Date(tglKey);
      return {
        id: tglKey,
        label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        tanggal: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        nama: d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
        gedung: 'Semua Gedung',
        hadir, alpha, izin, sakit,
        hadir_pct: pct(hadir),
        alpha_pct: pct(alpha),
        izin_pct:  pct(izin),
        sakit_pct: pct(sakit),
        total
      };
    });

    // 4. Kegiatan terbaru (5)
    const kegiatanRaw = await prisma.kegiatanPembinaan.findMany({
      orderBy: { tanggal_kegiatan: 'desc' },
      take: 5,
      include: { fasilitator: { select: { nama: true } }, gedung: { select: { nama_gedung: true } } }
    });
    const kegiatan_terbaru = kegiatanRaw.map(k => ({
      id_kegiatan: k.id_kegiatan, nama_kegiatan: k.nama_kegiatan,
      status_kegiatan: k.status_kegiatan, fasilitator: k.fasilitator.nama,
      gedung: k.gedung.nama_gedung, tanggal: formatTglLong(k.tanggal_kegiatan),
    }));

    // 5. Izin terbaru menunggu (5)
    const hitungDiajukan = (created) => {
      const d = Math.floor((now - new Date(created)) / 86400000);
      if (d === 0) return 'Hari ini'; if (d === 1) return 'Kemarin'; return `${d} hari lalu`;
    };
    const izinRaw = await prisma.perizinan.findMany({
      where: { status_pengajuan: 'MENUNGGU' }, orderBy: { created_at: 'desc' }, take: 5,
      include: { mahasiswa: { include: { gedung: { select: { nama_gedung: true } } } } }
    });
    const izin_terbaru = izinRaw.map(p => {
      const nama = p.mahasiswa.nama;
      const inisial = nama.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      const durasi = Math.round((new Date(p.tanggal_selesai) - new Date(p.tanggal_mulai)) / 86400000);
      return {
        id: p.id_perizinan, nama_mahasiswa: nama, inisial,
        gedung: p.mahasiswa.gedung?.nama_gedung || '-',
        jenis_izin: p.jenis_izin === 'PULANG_KAMPUNG' ? 'Pulang Kampung' : 'Kegiatan Luar',
        durasi_hari: durasi > 0 ? durasi : p.durasi_hari,
        status: p.status_pengajuan, diajukan_label: hitungDiajukan(p.created_at)
      };
    });

    // 6. Kegiatan per gedung bulan ini
    const gedungList = await prisma.gedung.findMany({ select: { id_gedung: true, nama_gedung: true, kode_gedung: true } });
    const kegiatan_per_gedung = [];
    for (const g of gedungList) {
      const count = await prisma.kegiatanPembinaan.count({
        where: { id_gedung: g.id_gedung, tanggal_kegiatan: { gte: startBulan, lte: endBulan } }
      });
      kegiatan_per_gedung.push({ gedung: g.nama_gedung, kode: g.kode_gedung, count });
    }

    res.json({
      status: "Sukses",
      message: "Data Dashboard Monitoring berhasil diambil",
      data: {
        statistik: {
          total_mahasiswa_aktif: totalMahasiswa, total_kegiatan_pembinaan: totalKegiatan,
          izin_menunggu_validasi: totalIzinMenunggu, izin_sedang_berjalan: totalIzinDisetujui
        },
        tren_kehadiran, kegiatan_terbaru, izin_terbaru, kegiatan_per_gedung
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat mengambil data dashboard." });
  }
};


// 2. Input Catatan Evaluasi dari Pokja ke Fasilitator
const tambahEvaluasi = async (req, res) => {
  const { id_fasilitator, id_gedung, catatan_evaluasi, bulan_periode, tahun_periode } = req.body;

  try {
    const id_ketua_pokja = req.user.id;

    if (req.user.role !== "KETUA_POKJA") {
      return res.status(403).json({ message: "Akses ditolak! Hanya Ketua Pokja yang dapat memberi evaluasi." });
    }

    // Simpan data evaluasi ke database
    const evaluasiBaru = await prisma.evaluasiPembinaan.create({
      data: {
        id_ketua_pokja,
        id_fasilitator,
        id_gedung,
        catatan_evaluasi,
        bulan_periode,
        tahun_periode
      }
    });

    // (Opsional) Disini bisa ditambah fitur pengiriman Notifikasi otomatis ke Fasilitator
    // lewat tabel Notifikasi (sesuai schema yang kamu buat).
    const truncateText = (text, maxLength) => {
      if (text.length > maxLength) return text.substring(0, maxLength) + '...';
      return text;
    };

    await prisma.notifikasi.create({
      data: {
        judul: "Catatan Evaluasi Baru dari Ketua Pokja",
        pesan: truncateText(catatan_evaluasi, 100),
        tipe_notifikasi: "INFO",
        id_fasilitator: id_fasilitator,
        id_referensi: evaluasiBaru.id_evaluasi
      }
    });

    res.status(201).json({
      status: "Sukses",
      message: "Catatan evaluasi berhasil dikirim ke Fasilitator!",
      data: evaluasiBaru
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Terjadi kesalahan server saat menyimpan evaluasi." });
  }
};

// 3. Menampilkan Riwayat Evaluasi (Ketua Pokja)
const getRiwayatEvaluasi = async (req, res) => {
  try {
    if (req.user.role !== "KETUA_POKJA") {
      return res.status(403).json({ message: "Akses ditolak!" });
    }

    const { fasilitator_id } = req.query;
    
    let whereClause = { id_ketua_pokja: req.user.id };
    if (fasilitator_id) {
      whereClause.id_fasilitator = Number(fasilitator_id);
    }

    const riwayat = await prisma.evaluasiPembinaan.findMany({
      where: whereClause,
      include: {
        fasilitator: { select: { nama: true } },
        gedung: { select: { nama_gedung: true } }
      },
      orderBy: { tanggal_evaluasi: 'desc' }
    });

    res.json({
      status: "Sukses",
      message: "Riwayat evaluasi berhasil diambil",
      data: riwayat
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Gagal memuat riwayat evaluasi." });
  }
};

module.exports = { getDashboardStats, tambahEvaluasi, getRiwayatEvaluasi };