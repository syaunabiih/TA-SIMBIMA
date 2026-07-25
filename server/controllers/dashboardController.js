const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── Helper ─────────────────────────────────────────────────────────────────
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const endOfDay   = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; };

// ============================================================================
// 1. Dashboard Fasilitator
// GET /api/dashboard/fasilitator
// ============================================================================
const getDashboardFasilitator = async (req, res) => {
  try {
    const id_fasilitator = req.user.id;

    // Ambil id_gedung fasilitator yang login
    const fasilitator = await prisma.fasilitator.findUnique({
      where: { id_fasilitator },
      select: { id_gedung: true, nama: true }
    });

    if (!fasilitator) {
      return res.status(404).json({ message: "Data fasilitator tidak ditemukan." });
    }

    const { id_gedung } = fasilitator;
    const now = new Date();
    const today = startOfDay(now);

    // Timeline helpers
    const startBulan = new Date(now.getFullYear(), now.getMonth(), 1);
    const endBulan   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startMingguIni = new Date(now);
    startMingguIni.setDate(now.getDate() - 7);
    const startMingguLalu = new Date(startMingguIni);
    startMingguLalu.setDate(startMingguLalu.getDate() - 7);

    const formatTgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    // 1. tren_kehadiran (10 Kegiatan Terakhir — semua status, terurut terbaru)
    const kegiatan10Terakhir = await prisma.kegiatanPembinaan.findMany({
      where: { id_gedung, tanggal_kegiatan: { lte: now } },
      orderBy: { tanggal_kegiatan: "desc" },
      take: 10,
      include: {
        kehadirans: { select: { status_kehadiran: true } }
      }
    });

    const tren_kehadiran = kegiatan10Terakhir
      .sort((a, b) => new Date(a.tanggal_kegiatan) - new Date(b.tanggal_kegiatan))
      .map(k => {
        let hadir = 0, alpha = 0, izin = 0, sakit = 0;
        k.kehadirans.forEach(ab => {
          if (ab.status_kehadiran === 'HADIR') hadir++;
          else if (ab.status_kehadiran === 'ALPHA') alpha++;
          else if (ab.status_kehadiran === 'IZIN') izin++;
          else if (ab.status_kehadiran === 'SAKIT') sakit++;
        });
        // Label unik: nama kegiatan singkat (max 14 char) + tanggal
        const namaShort = k.nama_kegiatan.length > 14
          ? k.nama_kegiatan.substring(0, 13) + '…'
          : k.nama_kegiatan;
        return {
          id: k.id_kegiatan,         // key unik untuk XAxis
          label: namaShort,
          tanggal: formatTgl(k.tanggal_kegiatan),
          nama: k.nama_kegiatan,
          status: k.status_kegiatan,
          hadir, alpha, izin, sakit
        };
      });

    // 2. distribusi_kehadiran (Bulan Ini)
    const kehadiranBulanIni = await prisma.kehadiran.findMany({
      where: {
        mahasiswa: { id_gedung },
        waktu_absen: { gte: startBulan, lte: endBulan }
      },
      select: { status_kehadiran: true }
    });

    const dist = { hadir: 0, alpha: 0, izin: 0, sakit: 0, total: kehadiranBulanIni.length };
    kehadiranBulanIni.forEach(k => {
      if (k.status_kehadiran === 'HADIR') dist.hadir++;
      else if (k.status_kehadiran === 'ALPHA') dist.alpha++;
      else if (k.status_kehadiran === 'IZIN') dist.izin++;
      else if (k.status_kehadiran === 'SAKIT') dist.sakit++;
    });

    const distribusi_kehadiran = {
      hadir: { jumlah: dist.hadir, persen: dist.total > 0 ? parseFloat(((dist.hadir/dist.total)*100).toFixed(1)) : 0 },
      alpha: { jumlah: dist.alpha, persen: dist.total > 0 ? parseFloat(((dist.alpha/dist.total)*100).toFixed(1)) : 0 },
      izin:  { jumlah: dist.izin,  persen: dist.total > 0 ? parseFloat(((dist.izin/dist.total)*100).toFixed(1))  : 0 },
      sakit: { jumlah: dist.sakit, persen: dist.total > 0 ? parseFloat(((dist.sakit/dist.total)*100).toFixed(1)) : 0 },
      total: dist.total
    };

    // 3. top5_mahasiswa_rajin
    const mhsGrouped = await prisma.kehadiran.groupBy({
      by: ['id_mahasiswa'],
      where: {
        mahasiswa: { id_gedung },
        status_kehadiran: 'HADIR',
        waktu_absen: { gte: startBulan, lte: endBulan }
      },
      _count: { id_kehadiran: true },
      orderBy: { _count: { id_kehadiran: 'desc' } },
      take: 5
    });

    const top5_mahasiswa_rajin = [];
    let rank = 1;
    for (const mg of mhsGrouped) {
      const mhsInfo = await prisma.mahasiswa.findUnique({ where: { id_mahasiswa: mg.id_mahasiswa }});
      if(mhsInfo) {
        top5_mahasiswa_rajin.push({
          rank: rank++,
          nama: mhsInfo.nama,
          kamar: mhsInfo.nomor_kamar,
          blok: `Lt ${mhsInfo.lantai}`,
          jumlah_hadir: mg._count.id_kehadiran,
          inisial: mhsInfo.nama.substring(0,2).toUpperCase()
        });
      }
    }

    // 4. mahasiswa_bermasalah
    const allMhs = await prisma.mahasiswa.findMany({
      where: { id_gedung, status_hunian: "AKTIF" },
      select: { id_mahasiswa: true, nama: true, nomor_kamar: true, lantai: true }
    });
    
    let alfaMhs = [];
    let alfaMingguIni = 0;
    let alfaMingguLalu = 0;

    for (const mhs of allMhs) {
      const last3 = await prisma.kehadiran.findMany({
        where: { id_mahasiswa: mhs.id_mahasiswa },
        orderBy: { kegiatan: { tanggal_kegiatan: 'desc' } },
        take: 3,
        include: { kegiatan: true }
      });
      if (last3.length === 3 && last3.every(k => k.status_kehadiran === 'ALPHA')) {
        const d = last3[0].kegiatan.tanggal_kegiatan;
        const isBaru = (now - new Date(d)) < 24*60*60*1000;
        
        if (new Date(d) >= startMingguIni) alfaMingguIni++;
        else if (new Date(d) >= startMingguLalu) alfaMingguLalu++;

        alfaMhs.push({
          nama: mhs.nama,
          kamar: mhs.nomor_kamar,
          blok: `Lt ${mhs.lantai}`,
          tipe: "ALFA_BERTURUT",
          keterangan: "Tidak hadir 3x berturut-turut",
          waktu: isBaru ? "Hari ini" : formatTgl(d),
          is_baru: isBaru,
          _date: new Date(d)
        });
      }
    }

    const tidakKembaliRaw = await prisma.perizinan.findMany({
      where: {
        mahasiswa: { id_gedung },
        status_pengajuan: "DISETUJUI",
        tanggal_selesai: { lt: today },
        foto_pulang: null
      },
      include: { mahasiswa: true },
      orderBy: { tanggal_selesai: 'desc' }
    });

    let izinMhs = tidakKembaliRaw.map(p => {
      const isBaru = (now - new Date(p.tanggal_selesai)) < 2*24*60*60*1000;
      return {
        nama: p.mahasiswa.nama,
        kamar: p.mahasiswa.nomor_kamar,
        blok: `Lt ${p.mahasiswa.lantai}`,
        tipe: "IZIN_TIDAK_KEMBALI",
        keterangan: `Belum kembali sejak ${formatTgl(p.tanggal_selesai)}`,
        waktu: isBaru ? "Kemarin" : formatTgl(p.tanggal_selesai),
        is_baru: isBaru,
        _date: new Date(p.tanggal_selesai)
      };
    });

    const mahasiswa_bermasalah = [...alfaMhs, ...izinMhs]
      .sort((a,b) => b._date - a._date)
      .map(item => {
        delete item._date;
        return item;
      });

    // 5. Stat Trends & Main Card Stats
    const total_mahasiswa = allMhs.length;
    
    const kegiatan_bulan_ini = await prisma.kegiatanPembinaan.count({
      where: { id_gedung, tanggal_kegiatan: { gte: startBulan, lte: endBulan } }
    });
    const kegiatan_bulan_lalu = await prisma.kegiatanPembinaan.count({
      where: { id_gedung, tanggal_kegiatan: { gte: new Date(now.getFullYear(), now.getMonth() - 1, 1), lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59) } }
    });

    const getPersenKehadiran = async (startD, endD) => {
      const k = await prisma.kehadiran.findMany({
        where: { mahasiswa: { id_gedung }, waktu_absen: { gte: startD, lte: endD } },
        select: { status_kehadiran: true }
      });
      if(!k.length) return 0;
      const hadirCount = k.filter(x => x.status_kehadiran === 'HADIR').length;
      return (hadirCount / k.length) * 100;
    };
    const persenKehMingguIni = await getPersenKehadiran(startMingguIni, now);
    const persenKehMingguLalu = await getPersenKehadiran(startMingguLalu, startMingguIni);
    
    const izin_menunggu = await prisma.perizinan.count({
      where: { mahasiswa: { id_gedung }, status_pengajuan: "MENUNGGU" }
    });
    const izinBaruMingguIni = await prisma.perizinan.count({
      where: { mahasiswa: { id_gedung }, tanggal_pengajuan: { gte: startMingguIni, lte: now } }
    });
    const izinBaruMingguLalu = await prisma.perizinan.count({
      where: { mahasiswa: { id_gedung }, tanggal_pengajuan: { gte: startMingguLalu, lt: startMingguIni } }
    });

    const trends = {
      total_mahasiswa_delta: 0,
      kegiatan_bulan_ini_delta: kegiatan_bulan_ini - kegiatan_bulan_lalu,
      kehadiran_persen_delta: parseFloat((persenKehMingguIni - persenKehMingguLalu).toFixed(1)),
      izin_menunggu_delta: izinBaruMingguIni - izinBaruMingguLalu,
      alfa_berturut_delta: alfaMingguIni - alfaMingguLalu
    };

    // 6. kegiatan_terbaru
    const kegiatanRaw = await prisma.kegiatanPembinaan.findMany({
      where: { id_gedung },
      include: { fasilitator: { select: { nama: true } }, gedung: { select: { nama_gedung: true } } },
      orderBy: { tanggal_kegiatan: "desc" },
      take: 4
    });

    const formatDateTimeRel = (dDate, dTime) => {
      const dt = new Date(dDate);
      const selisih = Math.floor((startOfDay(dt) - today) / (1000 * 60 * 60 * 24));
      const time = new Date(dTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      if (selisih === 0) return `Hari ini, ${time}`;
      if (selisih === -1) return `Kemarin, ${time}`;
      if (selisih === 1) return `Besok, ${time}`;
      return `${formatTgl(dt)}, ${time}`;
    };

    const kegiatan_terbaru = kegiatanRaw.map(k => {
      let statusView = k.status_kegiatan;
      const tgl_mulai_full = new Date(k.tanggal_kegiatan);
      const w_mulai = new Date(k.waktu_mulai);
      tgl_mulai_full.setHours(w_mulai.getHours(), w_mulai.getMinutes(), 0);
      
      if (tgl_mulai_full > now && k.status_kegiatan === 'BERLANGSUNG') {
        statusView = 'AKAN_DATANG';
      }

      return {
        id_kegiatan: k.id_kegiatan,
        nama_kegiatan: k.nama_kegiatan,
        lokasi: k.lokasi,
        status_kegiatan: statusView,
        fasilitator: k.fasilitator.nama,
        gedung: k.gedung.nama_gedung,
        waktu_rel: formatDateTimeRel(k.tanggal_kegiatan, k.waktu_mulai)
      };
    });

    // 7. izin_terbaru (max 5, status MENUNGGU)
    const formatTglLong = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const hitungDiajukan = (created) => {
      const diffMs = now - new Date(created);
      const diffHari = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffHari === 0) return 'Hari ini';
      if (diffHari === 1) return 'Kemarin';
      return `${diffHari} hari lalu`;
    };

    const izinRaw = await prisma.perizinan.findMany({
      where: {
        mahasiswa: { id_gedung },
        status_pengajuan: 'MENUNGGU'
      },
      orderBy: { created_at: 'desc' },
      take: 5,
      include: {
        mahasiswa: true
      }
    });

    const izin_terbaru = izinRaw.map(p => {
      const nama = p.mahasiswa.nama;
      const inisial = nama.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      const selisihHari = Math.round(
        (new Date(p.tanggal_selesai) - new Date(p.tanggal_mulai)) / (1000 * 60 * 60 * 24)
      );
      return {
        id: p.id_perizinan,
        nama_mahasiswa: nama,
        inisial,
        kamar: p.mahasiswa.nomor_kamar,
        jenis_izin: p.jenis_izin === 'PULANG_KAMPUNG' ? 'Pulang Kampung' : 'Kegiatan Luar',
        tanggal_mulai: formatTglLong(p.tanggal_mulai),
        tanggal_selesai: formatTglLong(p.tanggal_selesai),
        durasi_hari: selisihHari > 0 ? selisihHari : p.durasi_hari,
        status: p.status_pengajuan,
        diajukan_label: hitungDiajukan(p.created_at)
      };
    });

    res.json({
      status: "Sukses",
      data: {
        total_mahasiswa,
        kegiatan_bulan_ini,
        kehadiran_persen: parseFloat(persenKehMingguIni.toFixed(1)),
        izin_menunggu,
        alfa_berturut: alfaMhs.length,
        trends,
        tren_kehadiran,
        distribusi_kehadiran,
        top5_mahasiswa_rajin,
        mahasiswa_bermasalah,
        kegiatan_terbaru,
        izin_terbaru
      }
    });

  } catch (error) {
    console.error("[getDashboardFasilitator]", error);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

// ============================================================================
// 2. Dashboard Mahasiswa
// GET /api/dashboard/mahasiswa
// ============================================================================
const getDashboardMahasiswa = async (req, res) => {
  try {
    const id_mahasiswa = req.user.id;
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { id_mahasiswa },
      select: { id_gedung: true, nama: true }
    });

    if (!mahasiswa) {
      return res.status(404).json({ message: "Data mahasiswa tidak ditemukan." });
    }

    const { id_gedung } = mahasiswa;
    const now = new Date();
    const today = startOfDay(now);
    
    const startBulanIni = new Date(now.getFullYear(), now.getMonth(), 1);
    const endBulanIni   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startBulanLalu = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endBulanLalu   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const formatTgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const formatTglLong = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const hitungDiajukan = (created) => {
      const diffMs = now - new Date(created);
      const diffHari = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffHari === 0) return 'Hari ini';
      if (diffHari === 1) return 'Kemarin';
      return `${diffHari} hari lalu`;
    };

    // 1. STAT
    // total_kegiatan = jumlah kegiatan gedung bulan ini (sama dengan yang tampil di menu Kegiatan jika difilter bulan ini)
    const getTotalKegiatan = async (start, end) => prisma.kegiatanPembinaan.count({
      where: { id_gedung, tanggal_kegiatan: { gte: start, lte: end } }
    });
    const getHadirKegiatan = async (start, end) => prisma.kehadiran.count({
      where: { id_mahasiswa, status_kehadiran: 'HADIR', waktu_absen: { gte: start, lte: end } }
    });

    const [totalKegiatanBulanIni, hadirBulanIni, totalKegiatanBulanLalu, hadirBulanLalu, alfaBulanIni, izinBulanIni, sakitBulanIni, izinPending] = await Promise.all([
      getTotalKegiatan(startBulanIni, endBulanIni),
      getHadirKegiatan(startBulanIni, endBulanIni),
      getTotalKegiatan(startBulanLalu, endBulanLalu),
      getHadirKegiatan(startBulanLalu, endBulanLalu),
      prisma.kehadiran.count({ where: { id_mahasiswa, status_kehadiran: 'ALPHA', waktu_absen: { gte: startBulanIni, lte: endBulanIni } } }),
      prisma.kehadiran.count({ where: { id_mahasiswa, status_kehadiran: 'IZIN', waktu_absen: { gte: startBulanIni, lte: endBulanIni } } }),
      prisma.kehadiran.count({ where: { id_mahasiswa, status_kehadiran: 'SAKIT', waktu_absen: { gte: startBulanIni, lte: endBulanIni } } }),
      prisma.perizinan.count({ where: { id_mahasiswa, status_pengajuan: 'MENUNGGU' } })
    ]);

    const persenBulanIni = totalKegiatanBulanIni > 0 ? Math.round((hadirBulanIni / totalKegiatanBulanIni) * 100) : 0;
    const persenBulanLalu = totalKegiatanBulanLalu > 0 ? Math.round((hadirBulanLalu / totalKegiatanBulanLalu) * 100) : 0;
    const trend_kehadiran = persenBulanIni - persenBulanLalu;

    // 2. IZIN AKTIF
    const izinAktifRaw = await prisma.perizinan.findFirst({
      where: {
        id_mahasiswa,
        status_pengajuan: { in: ['MENUNGGU', 'DISETUJUI'] },
        tanggal_selesai: { gte: today }
      },
      orderBy: { created_at: 'desc' }
    });

    let izin_aktif = null;
    let status_asrama = "DI_ASRAMA";
    if (izinAktifRaw) {
      if (izinAktifRaw.status_pengajuan === 'DISETUJUI' && new Date(izinAktifRaw.tanggal_mulai) <= today) {
        status_asrama = "SEDANG_IZIN";
      }
      const selisihHari = Math.round((new Date(izinAktifRaw.tanggal_selesai) - new Date(izinAktifRaw.tanggal_mulai)) / (1000 * 60 * 60 * 24));
      izin_aktif = {
        id: izinAktifRaw.id_perizinan,
        jenis_izin: izinAktifRaw.jenis_izin === 'PULANG_KAMPUNG' ? 'Pulang Kampung' : 'Kegiatan Luar',
        tanggal_mulai: formatTglLong(izinAktifRaw.tanggal_mulai),
        tanggal_selesai: formatTglLong(izinAktifRaw.tanggal_selesai),
        durasi_hari: selisihHari > 0 ? selisihHari : izinAktifRaw.durasi_hari,
        diajukan_label: hitungDiajukan(izinAktifRaw.created_at),
        status: izinAktifRaw.status_pengajuan,
        foto_berangkat: izinAktifRaw.foto_berangkat,
        foto_pulang: izinAktifRaw.foto_pulang
      };
    }

    const stat = {
      kehadiran_persen: persenBulanIni,
      kehadiran_count: hadirBulanIni,
      total_kegiatan: totalKegiatanBulanIni,
      status_asrama,
      alfa_bulan_ini: alfaBulanIni,
      izin_bulan_ini: izinBulanIni,
      sakit_bulan_ini: sakitBulanIni,
      izin_pending: izinPending,
      trend_kehadiran
    };

    // 3. RIWAYAT IZIN (3 terakhir selain yang aktif)
    const riwayatWhere = { id_mahasiswa, status_pengajuan: { in: ['DISETUJUI', 'DITOLAK'] } };
    if (izinAktifRaw) {
      riwayatWhere.id_perizinan = { not: izinAktifRaw.id_perizinan };
    }
    const riwayatIzinRaw = await prisma.perizinan.findMany({
      where: riwayatWhere,
      orderBy: { created_at: 'desc' },
      take: 3
    });

    const riwayat_izin = riwayatIzinRaw.map(p => {
      const startStr = formatTgl(p.tanggal_mulai);
      const endStr = formatTglLong(p.tanggal_selesai);
      const selisihHari = Math.round((new Date(p.tanggal_selesai) - new Date(p.tanggal_mulai)) / (1000 * 60 * 60 * 24));
      return {
        id: p.id_perizinan,
        jenis_izin: p.jenis_izin === 'PULANG_KAMPUNG' ? 'Pulang Kampung' : 'Kegiatan Luar',
        tanggal_range: `${startStr} – ${endStr}`,
        durasi_hari: selisihHari > 0 ? selisihHari : p.durasi_hari,
        status: p.status_pengajuan
      };
    });

    // 4. KEGIATAN HARI INI
    const kegiatanHariIniRaw = await prisma.kegiatanPembinaan.findMany({
      where: { id_gedung, tanggal_kegiatan: today },
      include: { kehadirans: { where: { id_mahasiswa } } },
      orderBy: { waktu_mulai: 'asc' }
    });

    const kegiatan_hari_ini = kegiatanHariIniRaw.map(k => {
      let status_kehadiran = "BELUM";
      const w_mulai = new Date(k.waktu_mulai);
      const w_selesai = new Date(k.waktu_selesai);
      
      const t_mulai = new Date(today);
      t_mulai.setHours(w_mulai.getHours(), w_mulai.getMinutes(), 0);
      const t_selesai = new Date(today);
      t_selesai.setHours(w_selesai.getHours(), w_selesai.getMinutes(), 0);

      if (k.kehadirans.length > 0) {
        status_kehadiran = k.kehadirans[0].status_kehadiran;
      } else {
        if (now >= t_mulai && now <= t_selesai) status_kehadiran = "BERLANGSUNG";
        else if (now > t_selesai) status_kehadiran = "ALPHA";
        else status_kehadiran = "BELUM";
      }

      const jam_mulai_str = w_mulai.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      let sesi = "Pagi";
      if (w_mulai.getHours() >= 12 && w_mulai.getHours() < 18) sesi = "Sore";
      else if (w_mulai.getHours() >= 18) sesi = "Malam";

      return {
        id: k.id_kegiatan,
        nama: k.nama_kegiatan,
        lokasi: k.lokasi,
        jam: jam_mulai_str,
        sesi,
        status_kehadiran
      };
    });

    // 5. RIWAYAT KEHADIRAN 30 HARI & TREN 70 HARI
    const start70 = new Date(today);
    start70.setDate(start70.getDate() - 69); // Untuk 10 minggu terakhir

    const kegHarianRaw = await prisma.kegiatanPembinaan.findMany({
      where: { id_gedung, tanggal_kegiatan: { gte: start70, lte: today } },
      include: { kehadirans: { where: { id_mahasiswa } } }
    });

    const formatTglDb = (d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
    };

    const kegByDate = {};
    for (const k of kegHarianRaw) {
      const dStr = formatTglDb(k.tanggal_kegiatan);
      if (!kegByDate[dStr]) kegByDate[dStr] = [];
      kegByDate[dStr].push(k);
    }

    const riwayat_kehadiran = [];
    const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dStr = formatTglDb(d);
      
      let statusHarian = "NONE";
      const kegHarian = kegByDate[dStr] || [];

      if (kegHarian.length > 0) {
        let hasAlpha = false, hasIzin = false, hasHadir = false, hasBelum = false;
        for (const k of kegHarian) {
          if (k.kehadirans.length > 0) {
            const st = k.kehadirans[0].status_kehadiran;
            if (st === 'ALPHA') hasAlpha = true;
            else if (st === 'IZIN' || st === 'SAKIT') hasIzin = true;
            else if (st === 'HADIR') hasHadir = true;
          } else {
            const w_selesai = new Date(k.waktu_selesai);
            const t_selesai = new Date(d);
            t_selesai.setHours(w_selesai.getHours(), w_selesai.getMinutes(), 0);
            if (now > t_selesai) hasAlpha = true;
            else hasBelum = true;
          }
        }
        if (hasAlpha) statusHarian = "ALPHA";
        else if (hasIzin) statusHarian = "IZIN";
        else if (hasHadir) statusHarian = "HADIR";
        else if (hasBelum) statusHarian = "NONE";
      }

      riwayat_kehadiran.push({
        tanggal: dStr,
        day_label: DAY_LABELS[d.getDay()],
        status: statusHarian
      });
    }

    // 6. TREN MINGGUAN (10 MINGGU TERAKHIR)
    const tren_mingguan = [];
    for (let i = 9; i >= 0; i--) {
      const wEnd = new Date(today);
      wEnd.setDate(today.getDate() - (i * 7));
      const wStart = new Date(wEnd);
      wStart.setDate(wStart.getDate() - 6);

      const mStartStr = wStart.toLocaleString('id-ID', { month: 'short' });
      const mEndStr = wEnd.toLocaleString('id-ID', { month: 'short' });
      const labelMinggu = mStartStr === mEndStr 
        ? `${wStart.getDate()} - ${wEnd.getDate()} ${mEndStr}`
        : `${wStart.getDate()} ${mStartStr} - ${wEnd.getDate()} ${mEndStr}`;

      let hadir = 0;
      let alfa = 0;
      let izin = 0;
      let sakit = 0;

      for (const k of kegHarianRaw) {
        const d = new Date(startOfDay(k.tanggal_kegiatan));
        if (d >= wStart && d <= wEnd) {
          if (k.kehadirans.length > 0) {
            const st = k.kehadirans[0].status_kehadiran;
            if (st === 'HADIR') hadir++;
            else if (st === 'ALPHA') alfa++;
            else if (st === 'IZIN') izin++;
            else if (st === 'SAKIT') sakit++;
          } else {
            const w_selesai = new Date(k.waktu_selesai);
            const t_selesai = new Date(d);
            t_selesai.setHours(w_selesai.getHours(), w_selesai.getMinutes(), 0);
            if (now > t_selesai) alfa++;
          }
        }
      }

      tren_mingguan.push({
        minggu: labelMinggu,
        hadir,
        alfa,
        izin,
        sakit
      });
    }

    // 7. REKAP TERBARU (1 rekap paling baru yang sudah PUBLISHED)
    const rekapTerbaruRaw = await prisma.rekapAbsensi.findFirst({
      where: { id_mahasiswa, status_publikasi: 'PUBLISHED' },
      orderBy: [{ created_at: 'desc' }],
      select: {
        id_rekap:             true,
        tanggal_mulai:        true,
        tanggal_selesai:      true,
        total_kegiatan:       true,
        total_hadir:          true,
        total_alpha:          true,
        total_izin:           true,
        persentase_kehadiran: true,
        status_iqab:          true,
        status_reward:        true,
        tanggal_publikasi:    true,
      }
    });

    let rekap_terbaru = null;
    if (rekapTerbaruRaw) {
      const fmtTglL = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      rekap_terbaru = {
        id_rekap:             rekapTerbaruRaw.id_rekap,
        periode:              `${fmtTglL(rekapTerbaruRaw.tanggal_mulai)} – ${fmtTglL(rekapTerbaruRaw.tanggal_selesai)}`,
        total_kegiatan:       rekapTerbaruRaw.total_kegiatan,
        total_hadir:          rekapTerbaruRaw.total_hadir,
        total_alpha:          rekapTerbaruRaw.total_alpha,
        total_izin:           rekapTerbaruRaw.total_izin,
        persentase_kehadiran: Number(rekapTerbaruRaw.persentase_kehadiran),
        status_iqab:          rekapTerbaruRaw.status_iqab,
        status_reward:        rekapTerbaruRaw.status_reward,
        tanggal_publikasi:    fmtTglL(rekapTerbaruRaw.tanggal_publikasi),
      };
    }

    // 8. RIWAYAT KEGIATAN (4 Kegiatan Terakhir)
    const riwayatKegiatanRaw = await prisma.kegiatanPembinaan.findMany({
      where: { id_gedung, tanggal_kegiatan: { lte: now } },
      orderBy: [{ tanggal_kegiatan: 'desc' }, { waktu_mulai: 'desc' }],
      take: 4,
      include: {
        kehadirans: { where: { id_mahasiswa } }
      }
    });

    const riwayat_kegiatan = riwayatKegiatanRaw.map(k => {
      let status_kehadiran = "ALPHA";
      if (k.kehadirans.length > 0) {
        status_kehadiran = k.kehadirans[0].status_kehadiran;
      } else {
        const w_selesai = new Date(k.waktu_selesai);
        const t_selesai = new Date(k.tanggal_kegiatan);
        t_selesai.setHours(w_selesai.getHours(), w_selesai.getMinutes(), 0);
        if (now < t_selesai) status_kehadiran = "BELUM";
      }
      
      return {
        id: k.id_kegiatan,
        nama_kegiatan: k.nama_kegiatan,
        tanggal: formatTglLong(k.tanggal_kegiatan),
        lokasi: k.lokasi,
        status_kehadiran
      };
    });

    res.json({
      status: "Sukses",
      data: {
        stat,
        kegiatan_hari_ini,
        izin_aktif,
        riwayat_izin,
        riwayat_kehadiran,
        tren_mingguan,
        rekap_terbaru,
        riwayat_kegiatan
      }
    });

  } catch (error) {
    console.error("[getDashboardMahasiswa]", error);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

module.exports = { getDashboardFasilitator, getDashboardMahasiswa, getPerluPerhatian };

// ============================================================================
// 3. Perlu Perhatian — Semua mahasiswa bermasalah (tanpa limit)
// GET /api/dashboard/fasilitator/perlu-perhatian?tipe=ALL|ALFA_BERTURUT|IZIN_TIDAK_KEMBALI
// ============================================================================
async function getPerluPerhatian(req, res) {
  try {
    const id_fasilitator = req.user.id;
    const { tipe = 'ALL' } = req.query;

    const fasilitator = await prisma.fasilitator.findUnique({
      where: { id_fasilitator },
      select: { id_gedung: true }
    });
    if (!fasilitator) return res.status(404).json({ message: 'Fasilitator tidak ditemukan.' });

    const { id_gedung } = fasilitator;
    const now = new Date();
    const today = startOfDay(now);
    const formatTgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    const allMhs = await prisma.mahasiswa.findMany({
      where: { id_gedung, status_hunian: 'AKTIF' },
      select: { id_mahasiswa: true, nama: true, nomor_kamar: true, lantai: true }
    });

    let alfaMhs = [];
    if (tipe === 'ALL' || tipe === 'ALFA_BERTURUT') {
      for (const mhs of allMhs) {
        const last3 = await prisma.kehadiran.findMany({
          where: { id_mahasiswa: mhs.id_mahasiswa },
          orderBy: { kegiatan: { tanggal_kegiatan: 'desc' } },
          take: 3,
          include: { kegiatan: true }
        });
        if (last3.length === 3 && last3.every(k => k.status_kehadiran === 'ALPHA')) {
          const d = last3[0].kegiatan.tanggal_kegiatan;
          const isBaru = (now - new Date(d)) < 24 * 60 * 60 * 1000;
          alfaMhs.push({
            nama: mhs.nama,
            kamar: mhs.nomor_kamar,
            blok: `Lt ${mhs.lantai}`,
            tipe: 'ALFA_BERTURUT',
            keterangan: 'Tidak hadir 3x berturut-turut',
            waktu: isBaru ? 'Hari ini' : formatTgl(d),
            is_baru: isBaru,
            _date: new Date(d)
          });
        }
      }
    }

    let izinMhs = [];
    if (tipe === 'ALL' || tipe === 'IZIN_TIDAK_KEMBALI') {
      const tidakKembaliRaw = await prisma.perizinan.findMany({
        where: {
          mahasiswa: { id_gedung },
          status_pengajuan: 'DISETUJUI',
          tanggal_selesai: { lt: today },
          foto_pulang: null
        },
        include: { mahasiswa: true },
        orderBy: { tanggal_selesai: 'desc' }
      });

      izinMhs = tidakKembaliRaw.map(p => {
        const isBaru = (now - new Date(p.tanggal_selesai)) < 2 * 24 * 60 * 60 * 1000;
        return {
          nama: p.mahasiswa.nama,
          kamar: p.mahasiswa.nomor_kamar,
          blok: `Lt ${p.mahasiswa.lantai}`,
          tipe: 'IZIN_TIDAK_KEMBALI',
          keterangan: `Belum kembali sejak ${formatTgl(p.tanggal_selesai)}`,
          waktu: isBaru ? 'Kemarin' : formatTgl(p.tanggal_selesai),
          is_baru: isBaru,
          _date: new Date(p.tanggal_selesai)
        };
      });
    }

    const hasil = [...alfaMhs, ...izinMhs]
      .sort((a, b) => b._date - a._date)
      .map(item => { delete item._date; return item; });

    res.json({ status: 'Sukses', data: hasil, total: hasil.length });
  } catch (error) {
    console.error('[getPerluPerhatian]', error);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
}
