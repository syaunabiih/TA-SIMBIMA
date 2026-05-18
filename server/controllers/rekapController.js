const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ==========================================
// 1. Generate Rekapitulasi Absensi
// ==========================================
const generateRekap = async (req, res) => {
  const { tanggal_mulai, tanggal_selesai, batas_alfa, pengumuman_iqab } = req.body;

  try {
    if (req.user.role !== "FASILITATOR") {
      return res.status(403).json({ message: "Akses ditolak! Hanya Fasilitator yang bisa membuat rekap." });
    }

    // Validasi input
    if (!tanggal_mulai || !tanggal_selesai) {
      return res.status(400).json({ message: "Tanggal mulai dan tanggal selesai wajib diisi." });
    }
    const tMulai  = new Date(tanggal_mulai);
    const tSelesai = new Date(tanggal_selesai);
    tSelesai.setHours(23, 59, 59, 999); // inklusif hari terakhir

    if (tSelesai <= tMulai) {
      return res.status(400).json({ message: "Tanggal selesai harus lebih besar dari tanggal mulai." });
    }

    const batasAlfa = batas_alfa ? Number(batas_alfa) : null;

    const id_fasilitator = req.user.id;
    const fasilitator = await prisma.fasilitator.findUnique({ where: { id_fasilitator } });
    if (!fasilitator) return res.status(404).json({ message: "Data fasilitator tidak ditemukan." });

    const id_gedung = fasilitator.id_gedung;

    // Derive bulan & tahun dari tanggal_mulai untuk pengecekan duplikat & label
    const bulan = tMulai.getMonth() + 1;
    const tahun  = tMulai.getFullYear();

    // Cegah generate ulang untuk periode yang sama (berdasar tanggal_mulai)
    const existing = await prisma.rekapAbsensi.findFirst({
      where: { id_gedung, tanggal_mulai: tMulai }
    });
    if (existing) {
      return res.status(400).json({
        message: `Rekap untuk periode mulai ${tanggal_mulai} sudah pernah dibuat. Silakan cek daftar rekap.`
      });
    }

    // Kegiatan SELESAI dalam rentang tanggal
    const kegiatanPeriode = await prisma.kegiatanPembinaan.findMany({
      where: {
        id_gedung,
        status_kegiatan: "SELESAI",
        tanggal_kegiatan: { gte: tMulai, lte: tSelesai }
      }
    });

    const total_kegiatan = kegiatanPeriode.length;
    if (total_kegiatan === 0) {
      return res.status(400).json({
        message: `Tidak ada kegiatan yang selesai pada periode ${tanggal_mulai} – ${tanggal_selesai}.`
      });
    }

    const idKegiatans = kegiatanPeriode.map(k => k.id_kegiatan);

    // Semua mahasiswa aktif di gedung
    const mahasiswas = await prisma.mahasiswa.findMany({
      where: { id_gedung, status_hunian: "AKTIF" }
    });

    let rekapDibuat = 0;

    for (const mhs of mahasiswas) {
      const kehadiranMhs = await prisma.kehadiran.findMany({
        where: { id_mahasiswa: mhs.id_mahasiswa, id_kegiatan: { in: idKegiatans } }
      });

      let total_hadir = 0;
      let total_izin  = 0;
      let total_alpha_aktual = 0;

      kehadiranMhs.forEach(k => {
        if (k.status_kehadiran === "HADIR") total_hadir++;
        else if (k.status_kehadiran === "IZIN" || k.status_kehadiran === "SAKIT") total_izin++;
        else if (k.status_kehadiran === "ALPHA") total_alpha_aktual++;
      });

      // Kegiatan yang tidak ada entri kehadiran = juga dihitung ALPHA
      const kegiatan_tidak_tercatat = total_kegiatan - kehadiranMhs.length;
      const total_alpha = total_alpha_aktual + kegiatan_tidak_tercatat;

      const persentase_kehadiran = ((total_hadir / total_kegiatan) * 100).toFixed(2);

      // Status reward berdasar persentase
      let status_reward = "AMAN";
      const pct = Number(persentase_kehadiran);
      if (pct >= 95)       status_reward = "REWARD_TERBAIK";
      else if (pct < 50)   status_reward = "DROP_OUT";
      else if (pct < 70)   status_reward = "PERINGATAN_2";
      else if (pct < 85)   status_reward = "PERINGATAN_1";

      // Status rekap baru: REWARD | DAPAT_IQAB | BEBAS_IQAB
      let status_iqab;
      if (total_hadir === total_kegiatan) {
        // Hadir penuh, tidak ada alfa/izin/sakit sama sekali
        status_iqab = "REWARD";
      } else if (batasAlfa !== null && total_alpha >= batasAlfa) {
        status_iqab = "DAPAT_IQAB";
      } else {
        status_iqab = "BEBAS_IQAB";
      }

      await prisma.rekapAbsensi.create({
        data: {
          bulan, tahun,
          tanggal_mulai:   tMulai,
          tanggal_selesai: tSelesai,
          batas_alfa:      batasAlfa,
          pengumuman_iqab: pengumuman_iqab || null,
          total_kegiatan, total_hadir, total_izin, total_alpha,
          persentase_kehadiran: Number(persentase_kehadiran),
          status_reward,
          status_iqab,
          status_publikasi:  'PUBLISHED',
          tanggal_publikasi: new Date(),
          id_gedung,
          id_mahasiswa: mhs.id_mahasiswa,
          id_fasilitator_generate: id_fasilitator
        }
      });
      rekapDibuat++;
    }

    // ── Kirim notifikasi ke semua mahasiswa yang mendapat rekap ──
    const fmtTgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const periodeLabel = `${fmtTgl(tMulai)} – ${fmtTgl(tSelesai)}`;

    // Ambil semua rekap yang baru dibuat untuk mendapat id_rekap per mahasiswa
    const rekapBaru = await prisma.rekapAbsensi.findMany({
      where: { id_gedung, tanggal_mulai: tMulai },
      select: { id_rekap: true, id_mahasiswa: true }
    });

    await Promise.all(rekapBaru.map(r =>
      prisma.notifikasi.create({
        data: {
          judul: `Rekap Absensi ${periodeLabel} Telah Diterbitkan`,
          pesan: `Hasil rekap kehadiran kamu untuk periode ${periodeLabel} sudah tersedia. Silakan cek status kehadiran dan iqab kamu di halaman Rekap Absensi.`,
          tipe_notifikasi: 'PENGUMUMAN',
          id_mahasiswa: r.id_mahasiswa,
          id_referensi: r.id_rekap,
          link_tujuan: '/mahasiswa/rekap',
        }
      })
    ));

    res.json({
      status: "Sukses",
      message: `Berhasil men-generate rekap untuk ${rekapDibuat} mahasiswa.`,
      data: { bulan, tahun, tanggal_mulai, tanggal_selesai }
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
  const { tanggal_mulai, bulan, tahun } = req.body;

  try {
    if (req.user.role !== "FASILITATOR") {
      return res.status(403).json({ message: "Akses ditolak!" });
    }

    const fasilitator = await prisma.fasilitator.findUnique({ where: { id_fasilitator: req.user.id } });

    // Filter berdasar tanggal_mulai (identifier baru) atau bulan+tahun (lama)
    let whereFilter;
    if (tanggal_mulai) {
      const tMulai = new Date(tanggal_mulai);
      whereFilter = { tanggal_mulai: tMulai, id_gedung: fasilitator.id_gedung, status_publikasi: "DRAFT" };
    } else {
      whereFilter = { bulan: Number(bulan), tahun: Number(tahun), id_gedung: fasilitator.id_gedung, status_publikasi: "DRAFT" };
    }

    // Ubah semua rekap periode tersebut dari DRAFT → PUBLISHED
    const updatePublikasi = await prisma.rekapAbsensi.updateMany({
      where: whereFilter,
      data: { status_publikasi: "PUBLISHED", tanggal_publikasi: new Date() }
    });

    if (updatePublikasi.count === 0) {
      return res.status(404).json({ message: "Tidak ada rekap berstatus DRAFT pada periode tersebut untuk dipublikasikan." });
    }

    // Ambil data rekap yang baru dipublikasikan untuk notifikasi
    const filterFind = tanggal_mulai
      ? { tanggal_mulai: new Date(tanggal_mulai), id_gedung: fasilitator.id_gedung }
      : { bulan: Number(bulan), tahun: Number(tahun), id_gedung: fasilitator.id_gedung };

    const dipublikasi = await prisma.rekapAbsensi.findMany({ where: filterFind });

    // Label periode untuk notifikasi
    let periodeLabel;
    if (tanggal_mulai) {
      const tgl = new Date(tanggal_mulai);
      periodeLabel = tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } else {
      const bulanStr = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"][Number(bulan)];
      periodeLabel = `${bulanStr} ${tahun}`;
    }

    const notifPromises = dipublikasi.map(r =>
      prisma.notifikasi.create({
        data: {
          judul: `Rekap Absensi ${periodeLabel} Telah Dipublikasi`,
          pesan: `Silakan cek hasil rekap kehadiran dan status kamu di dashboard.`,
          tipe_notifikasi: "PENGUMUMAN",
          id_mahasiswa: r.id_mahasiswa,
          id_referensi: r.id_rekap
        }
      })
    );

    await Promise.all(notifPromises);

    res.json({
      status: "Sukses",
      message: `Berhasil mempublikasikan ${updatePublikasi.count} rekapitulasi. Mahasiswa sekarang dapat melihatnya di dashboard.`
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Terjadi kesalahan server saat mempublikasi rekap." });
  }
};

// ==========================================
// 3. Get Daftar Grup Rekap Fasilitator
// ==========================================
const getDaftarRekapFasilitator = async (req, res) => {
  try {
    let id_gedung;

    if (req.user.role === "FASILITATOR") {
      const fasil = await prisma.fasilitator.findUnique({ where: { id_fasilitator: req.user.id }});
      if (!fasil) return res.status(404).json({ message: "Data fasilitator tidak ditemukan." });
      id_gedung = fasil.id_gedung;
    } else if (req.user.role === "SUPERADMIN") {
      // SUPERADMIN bisa filter per gedung via query param, atau lihat semua
      id_gedung = req.query.id_gedung ? Number(req.query.id_gedung) : undefined;
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    const whereClause = id_gedung ? { id_gedung } : {};

    // Ambil satu baris perwakilan per tanggal_mulai (unique per periode generate)
    const rekaps = await prisma.rekapAbsensi.findMany({
      where: whereClause,
      distinct: ['tanggal_mulai'],
      select: {
        tanggal_mulai:     true,
        tanggal_selesai:   true,
        bulan:             true,
        tahun:             true,
        status_publikasi:  true,
        tanggal_generate:  true,
        batas_alfa:        true,
        gedung:            { select: { nama_gedung: true, kode_gedung: true } },
      },
      orderBy: { tanggal_mulai: 'desc' },
    });

    res.json({ status: "Sukses", data: rekaps });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Kesalahan server saat memuat daftar rekap." });
  }
};

// ==========================================
// 4. Get Detail Rekap berdasarkan tanggal_mulai
// ==========================================
const getDetailRekapBulanTahun = async (req, res) => {
  // Param bisa berupa tanggal_mulai (YYYY-MM-DD) ATAU :bulan/:tahun (lama)
  const { bulan, tahun } = req.params;

  try {
    let id_gedung;
    if (req.user.role === "FASILITATOR") {
      const fasil = await prisma.fasilitator.findUnique({ where: { id_fasilitator: req.user.id }});
      if (!fasil) return res.status(404).json({ message: "Data fasilitator tidak ditemukan." });
      id_gedung = fasil.id_gedung;
    } else if (req.user.role === "SUPERADMIN") {
      id_gedung = req.query.id_gedung ? Number(req.query.id_gedung) : undefined;
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Coba parse sebagai tanggal ISO (format YYYY-MM-DD dikirim sebagai :bulan param)
    let whereClause;
    if (bulan && bulan.length > 4) {
      const tMulai = new Date(bulan);
      whereClause = { tanggal_mulai: tMulai, ...(id_gedung ? { id_gedung } : {}) };
    } else {
      whereClause = { bulan: Number(bulan), tahun: Number(tahun), ...(id_gedung ? { id_gedung } : {}) };
    }

    const detail = await prisma.rekapAbsensi.findMany({
      where: whereClause,
      include: { mahasiswa: { select: { nama: true, nim: true, nomor_kamar: true } } },
      orderBy: { mahasiswa: { nama: 'asc' } }
    });

    res.json({ status: "Sukses", data: detail });
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: "Kesalahan membaca detail rekap." });
  }
};

// ==========================================
// 5. Get Riwayat Rekap Mahasiswa
// ==========================================
const getRiwayatRekapMahasiswa = async (req, res) => {
  try {
    if (req.user.role !== "MAHASISWA") return res.status(403).json({ message: "Forbidden" });

    const riwayat = await prisma.rekapAbsensi.findMany({
      where: { id_mahasiswa: req.user.id, status_publikasi: 'PUBLISHED' },
      select: {
        id_rekap:            true,
        bulan:               true,
        tahun:               true,
        tanggal_mulai:       true,
        tanggal_selesai:     true,
        batas_alfa:          true,
        pengumuman_iqab:     true,
        total_kegiatan:      true,
        total_hadir:         true,
        total_izin:          true,
        total_alpha:         true,
        persentase_kehadiran: true,
        status_reward:       true,
        status_iqab:         true,
        tanggal_publikasi:   true,
      },
      orderBy: [{ tanggal_mulai: 'desc' }, { tahun: 'desc' }, { bulan: 'desc' }]
    });

    res.json({ status: "Sukses", data: riwayat });
  } catch(error) {
    console.error(error);
    res.status(500).json({ message: "Kesalahan membaca riwayat rekap mahasiswa." });
  }
};


// ==========================================
// 6. Export Rekap to Excel
// ==========================================
const exportExcelRekap = async (req, res) => {
  const { bulan, tahun } = req.params;

  try {
    let id_gedung;
    if (req.user.role === "FASILITATOR") {
      const fasil = await prisma.fasilitator.findUnique({ where: { id_fasilitator: req.user.id } });
      if (!fasil) return res.status(404).json({ message: "Data fasilitator tidak ditemukan." });
      id_gedung = fasil.id_gedung;
    } else if (req.user.role === "SUPERADMIN") {
      id_gedung = req.query.id_gedung ? Number(req.query.id_gedung) : undefined;
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    let whereClause;
    if (bulan && bulan.length > 4) {
      whereClause = { tanggal_mulai: new Date(bulan), ...(id_gedung ? { id_gedung } : {}) };
    } else {
      whereClause = { bulan: Number(bulan), tahun: Number(tahun), ...(id_gedung ? { id_gedung } : {}) };
    }

    const detail = await prisma.rekapAbsensi.findMany({
      where: whereClause,
      include: { mahasiswa: { select: { nama: true, nim: true, nomor_kamar: true } } },
      orderBy: { mahasiswa: { nama: 'asc' } }
    });

    if (detail.length === 0) {
      return res.status(404).json({ message: "Data rekap tidak ditemukan." });
    }

    const info = detail[0];
    const fmtTgl = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const strPeriode = info.tanggal_mulai
      ? `${fmtTgl(info.tanggal_mulai)} - ${fmtTgl(info.tanggal_selesai)}`
      : `${bulan}-${tahun || ''}`;

    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SIMBIMA';
    wb.created = new Date();
    const ws = wb.addWorksheet('Rekap Absensi');

    // Baris 1: Judul
    ws.mergeCells('A1:I1');
    const title = ws.getCell('A1');
    title.value = 'REKAP ABSENSI ASRAMA';
    title.font = { bold: true, size: 14 };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 26;

    // Baris 2-4: Info
    ws.getCell('A2').value = `Periode: ${strPeriode}`;
    ws.getCell('A3').value = `Batas Alfa: ${info.batas_alfa != null ? info.batas_alfa : '-'}x`;
    ws.getCell('A4').value = `Penebusan Iqab: ${info.pengumuman_iqab || '-'}`;

    // Baris 6: Header
    const hr = ws.getRow(6);
    hr.values = ['NO', 'NAMA', 'NIM', 'KAMAR', 'HADIR', 'IZIN/SAKIT', 'ALPHA', '% KEHADIRAN', 'STATUS'];
    hr.height = 20;
    hr.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // Baris 7+: Data
    detail.forEach((r, i) => {
      const statusLabel = r.status_iqab === 'REWARD' ? 'REWARD'
        : r.status_iqab === 'DAPAT_IQAB' ? 'DAPAT IQAB' : 'BEBAS IQAB';
      const dr = ws.getRow(7 + i);
      dr.values = [i + 1, r.mahasiswa?.nama || '', r.mahasiswa?.nim || '',
        r.mahasiswa?.nomor_kamar || '-',
        r.total_hadir, r.total_izin, r.total_alpha,
        Number(r.persentase_kehadiran) || 0, statusLabel];
      dr.eachCell({ includeEmpty: true }, (cell, col) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        if ([1, 4, 5, 6, 7, 8, 9].includes(col)) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      const sc = dr.getCell(9);
      if (r.status_iqab === 'REWARD')     sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
      if (r.status_iqab === 'DAPAT_IQAB') sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
    });

    // Lebar kolom
    ws.columns = [
      { width: 6 },  // NO
      { width: 28 }, // NAMA
      { width: 18 }, // NIM
      { width: 12 }, // KAMAR
      { width: 10 }, // HADIR
      { width: 12 }, // IZIN/SAKIT
      { width: 10 }, // ALPHA
      { width: 14 }, // % KEHADIRAN
      { width: 14 }, // STATUS
    ];

    // Kirim sebagai buffer (lebih reliable dari write(res))
    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="rekap-${bulan || 'periode'}.xlsx"`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);

  } catch (error) {
    console.error('[exportExcelRekap] ERROR:', error.message);
    console.error(error.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Export gagal: ' + error.message });
    }
  }
};

module.exports = { generateRekap, publikasiRekap, getDaftarRekapFasilitator, getDetailRekapBulanTahun, getRiwayatRekapMahasiswa, exportExcelRekap };