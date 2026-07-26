const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const path = require('path');
const fs   = require('fs');

// ─── Path Logo ──────────────────────────────────────────────────────────────
const LOGO_PATH = path.join(__dirname, '..', 'assets', 'logo-unand.png');
const LOGO_EXISTS = fs.existsSync(LOGO_PATH);

// ─── Teks Kop Surat ─────────────────────────────────────────────────────────
const KOP_LINES = [
  { text: 'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI', bold: true, size: 9 },
  { text: 'UNIVERSITAS ANDALAS',                                  bold: true, size: 12 },
  { text: 'ANDALAS RESIDENCE',                                    bold: true, size: 10 },
  { text: 'Gedung Asrama Roesma/M.Syaff, Limau Manis Padang - 25163', bold: false, size: 9 },
  { text: 'Telp. 0811-6699634        Fax. 0751-71085',           bold: false, size: 9 },
  { text: 'Laman: https://andalasresidence.unand.ac.id   e-mail: andalasresidence@unand.ac.id', bold: false, size: 8 },
];

// ─── Format tanggal helper ───────────────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

const BULAN_ID = [
  '', 'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

// ============================================================================
// KOP SURAT — PDF
// Dipanggil sekali di awal + otomatis via event 'pageAdded'
// ============================================================================
const PDF_MARGIN = 50; // margin konsisten untuk SEMUA elemen PDF

function addKopSuratPDF(doc) {
  const pageWidth  = doc.page.width;
  const M          = PDF_MARGIN;
  const logoSize   = 70;
  const textStartX = M + (LOGO_EXISTS ? logoSize + 10 : 0);
  const textWidth  = pageWidth - textStartX - M;
  let   curY       = M;

  // Logo
  if (LOGO_EXISTS) {
    doc.image(LOGO_PATH, M, curY, { width: logoSize, height: logoSize });
  }

  // Teks kop (Times New Roman, rata tengah)
  KOP_LINES.forEach(({ text, bold, size }) => {
    doc
      .font(bold ? 'Times-Bold' : 'Times-Roman')
      .fontSize(size)
      .fillColor('#000000')
      .text(text, textStartX, curY, { width: textWidth, align: 'center' });
    curY = doc.y;
  });

  // Posisi garis = max(bawah logo, bawah teks) + 6
  const lineY = Math.max(M + logoSize + 6, doc.y + 6);

  // Garis tebal (2pt)
  doc.moveTo(M, lineY).lineTo(pageWidth - M, lineY)
     .lineWidth(2).strokeColor('#000000').stroke();
  // Garis tipis (0.5pt) 3px di bawahnya
  doc.moveTo(M, lineY + 3).lineTo(pageWidth - M, lineY + 3)
     .lineWidth(0.5).stroke();

  // Reset ke kondisi konten
  doc.font('Times-Roman').fontSize(11).fillColor('#000000').strokeColor('#000000').lineWidth(1);

  // Posisikan kursor ke bawah garis
  const safeY = lineY + 14;
  doc.y = Math.max(doc.y, safeY);
}


// ============================================================================
// KOP SURAT — EXCEL (per worksheet)
// Menambahkan 8 baris kop surat di atas data, dengan logo dan teks
// ============================================================================
async function addKopSuratExcel(ws, workbook, logoImageId, periodeLabel) {
  // Sisipkan 9 baris kosong di atas (baris 1-9 = kop surat, baris 10 = garis pemisah)
  const KOP_ROW_COUNT = 9;

  // Geser semua baris data ke bawah sebanyak KOP_ROW_COUNT baris
  ws.spliceRows(1, 0, ...Array(KOP_ROW_COUNT).fill([]));

  // Lebar kolom A untuk logo
  ws.getColumn(1).width = 18;

  // Merge kolom B sampai H untuk teks kop surat (baris 1-8)
  const LAST_COL = 'H';
  for (let r = 1; r <= 8; r++) {
    ws.mergeCells(`B${r}:${LAST_COL}${r}`);
  }

  // Teks kop surat di cell B1–B6
  const kopTextStyles = [
    { row: 1, text: 'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI', bold: true,  size: 10 },
    { row: 2, text: 'UNIVERSITAS ANDALAS',                                  bold: true,  size: 13 },
    { row: 3, text: 'ANDALAS RESIDENCE',                                    bold: true,  size: 11 },
    { row: 4, text: 'Gedung Asrama Roesma/M.Syaff, Limau Manis Padang - 25163', bold: false, size: 9 },
    { row: 5, text: 'Telp. 0811-6699634        Fax. 0751-71085',           bold: false, size: 9 },
    { row: 6, text: 'Laman: https://andalasresidence.unand.ac.id   e-mail: andalasresidence@unand.ac.id', bold: false, size: 8 },
    { row: 7, text: '', bold: false, size: 9 },
    { row: 8, text: `Laporan Monitoring Asrama — Periode: ${periodeLabel}`, bold: true,  size: 10 },
  ];

  kopTextStyles.forEach(({ row, text, bold, size }) => {
    const cell = ws.getCell(`B${row}`);
    cell.value = text;
    cell.font  = { name: 'Times New Roman', bold, size };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  // Tinggi baris kop
  [1,2,3,4,5,6,7,8].forEach(r => {
    ws.getRow(r).height = r === 2 ? 22 : 16;
  });

  // Logo di cell A1, span A1:A8
  if (LOGO_EXISTS && logoImageId !== null) {
    ws.addImage(logoImageId, {
      tl: { col: 0, row: 0 },
      br: { col: 1, row: 8 },
      editAs: 'oneCell',
    });
  }

  // Baris pemisah (baris 9) — border bawah tebal
  const sepRow = ws.getRow(KOP_ROW_COUNT);
  sepRow.height = 4;
  for (let c = 1; c <= 8; c++) {
    const cell = sepRow.getCell(c);
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF000000' } }
    };
  }
}

// ============================================================================
// MAIN EXPORT CONTROLLER
// ============================================================================
exports.exportLaporanMonitoring = async (req, res) => {
  try {
    const { periode, format, sections } = req.query;

    // Default to current month if periode is missing
    const targetDate  = periode ? new Date(periode + '-01') : new Date();
    const targetMonth = targetDate.getMonth() + 1;
    const targetYear  = targetDate.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate   = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Normalize sections array
    let activeSections = [];
    if (Array.isArray(sections)) {
      activeSections = sections;
    } else if (typeof sections === 'string') {
      activeSections = [sections];
    } else {
      activeSections = ['summary', 'asrama', 'kegiatan', 'perizinan', 'perhatian-khusus', 'rekomendasi'];
    }

    // Label periode yang readable, misal "Juli 2026"
    const periodeLabel = `${BULAN_ID[targetMonth]} ${targetYear}`;

    // Nama file yang readable
    const fileBaseName = `Laporan_Monitoring_${BULAN_ID[targetMonth]}_${targetYear}`;

    // --- DATA GATHERING ---
    const data = {
      periodeLabel,
      timestamp: new Date()
    };

    // 1. Summary
    if (activeSections.includes('summary')) {
      const [totalGedung, totalMahasiswa, totalFasilitator, kapResult, totalKegiatanPeriode] = await Promise.all([
        prisma.gedung.count({ where: { status_gedung: 'AKTIF' } }),
        prisma.mahasiswa.count({ where: { status_hunian: 'AKTIF' } }),
        prisma.fasilitator.count(),
        prisma.gedung.aggregate({ _sum: { kapasitas_mahasiswa: true }, where: { status_gedung: 'AKTIF' } }),
        prisma.kegiatanPembinaan.count({ where: { tanggal_kegiatan: { gte: startDate, lte: endDate } } })
      ]);
      data.summary = {
        totalGedung,
        totalMahasiswa,
        totalFasilitator,
        totalKapasitas: kapResult._sum.kapasitas_mahasiswa || 0,
        totalKegiatanPeriode
      };
    }

    // 2. Kehadiran per Asrama
    if (activeSections.includes('asrama')) {
      const gedungs = await prisma.gedung.findMany({
        where: { status_gedung: 'AKTIF' },
        include: {
          mahasiswas: { where: { status_hunian: 'AKTIF' }, select: { id_mahasiswa: true } },
          rekaps: { where: { bulan: targetMonth, tahun: targetYear } },
          kegiatans: {
            where: { tanggal_kegiatan: { gte: startDate, lte: endDate } },
            select: { id_kegiatan: true }
          }
        }
      });
      data.asrama = gedungs.map(g => {
        const totalMahasiswa  = g.mahasiswas.length;
        const jumlahKegiatan  = g.kegiatans.length;
        const totalHadir = g.rekaps.reduce((acc, r) => acc + r.total_hadir, 0);
        const totalIzin  = g.rekaps.reduce((acc, r) => acc + r.total_izin,  0);
        const totalAlpha = g.rekaps.reduce((acc, r) => acc + r.total_alpha, 0);
        const totalSemua = totalHadir + totalIzin + totalAlpha;
        const persentase = totalSemua > 0 ? ((totalHadir / totalSemua) * 100).toFixed(2) : 0;
        return {
          nama: g.nama_gedung,
          totalMahasiswa,
          jumlahKegiatan,
          hadir: totalHadir,
          izin: totalIzin,
          alpha: totalAlpha,
          persentase: `${persentase}%`
        };
      });
    }

    // 3. Rekap Kegiatan
    if (activeSections.includes('kegiatan')) {
      const kegiatans = await prisma.kegiatanPembinaan.findMany({
        where: { tanggal_kegiatan: { gte: startDate, lte: endDate } },
        include: {
          gedung: true,
          kehadirans: true,
          jenis_kegiatan: { select: { nama_jenis: true, is_wajib: true } }
        },
        orderBy: [{ tanggal_kegiatan: 'asc' }, { id_gedung: 'asc' }]
      });
      data.kegiatan = kegiatans.map(k => ({
        nama:       k.nama_kegiatan,
        jenisKegiatan: k.jenis_kegiatan?.nama_jenis ?? '-',
        wajib:      k.jenis_kegiatan?.is_wajib ? 'Wajib' : 'Tidak Wajib',
        gedung:     k.gedung.nama_gedung,
        tanggal:    formatDate(k.tanggal_kegiatan),
        status:     k.status_kegiatan,
        totalHadir: k.kehadirans.filter(h => h.status_kehadiran === 'HADIR').length,
        totalIzin:  k.kehadirans.filter(h => h.status_kehadiran === 'IZIN').length,
        totalSakit: k.kehadirans.filter(h => h.status_kehadiran === 'SAKIT').length,
        totalAlpha: k.kehadirans.filter(h => h.status_kehadiran === 'ALPHA').length,
      }));
    }

    // 4. Rekap Perizinan
    if (activeSections.includes('perizinan')) {
      const perizinans = await prisma.perizinan.findMany({
        where: { tanggal_pengajuan: { gte: startDate, lte: endDate } },
        include: { mahasiswa: { include: { gedung: true } } }
      });

      const disetujui  = perizinans.filter(p => p.status_pengajuan === 'DISETUJUI').length;
      const ditolak    = perizinans.filter(p => p.status_pengajuan === 'DITOLAK').length;
      const menunggu   = perizinans.filter(p => p.status_pengajuan === 'MENUNGGU').length;
      const selesai    = perizinans.filter(p => p.status_pengajuan === 'SELESAI').length;
      const dibatalkan = perizinans.filter(p => p.status_pengajuan === 'DIBATALKAN').length;
      const pulangKampung  = perizinans.filter(p => p.jenis_izin === 'PULANG_KAMPUNG').length;
      const kegiatanLuar   = perizinans.filter(p => p.jenis_izin === 'KEGIATAN_LUAR').length;

      const now = new Date();
      const terlambat = perizinans.filter(p =>
        p.status_pengajuan === 'DISETUJUI' &&
        new Date(p.tanggal_selesai) < now &&
        !p.returned_at
      );

      data.perizinan = {
        total: perizinans.length,
        disetujui, ditolak, menunggu, selesai, dibatalkan,
        pulangKampung, kegiatanLuar,
        terlambat: terlambat.length,
        daftarTerlambat: terlambat.map(t => ({
          nama:          t.mahasiswa.nama,
          nim:           t.mahasiswa.nim,
          asrama:        t.mahasiswa.gedung?.nama_gedung ?? '-',
          jenisIzin:     t.jenis_izin === 'PULANG_KAMPUNG' ? 'Pulang Kampung' : 'Kegiatan Luar',
          durasi:        t.durasi_hari,
          tanggalMulai:  formatDate(t.tanggal_mulai),
          tanggalSelesai: formatDate(t.tanggal_selesai)
        }))
      };
    }

    // 5. Perhatian Khusus
    if (activeSections.includes('perhatian-khusus')) {
      const mahasiswaBermasalah = await prisma.mahasiswa.findMany({
        where: {
          status_reward: { notIn: ['AMAN', 'REWARD_TERBAIK'] }
        },
        include: { gedung: true }
      });
      data.perhatianKhusus = mahasiswaBermasalah.map(m => ({
        nama: m.nama,
        nim: m.nim,
        gedung: m.gedung.nama_gedung,
        status: m.status_reward
      }));
    }

    // 6. Rekomendasi
    if (activeSections.includes('rekomendasi')) {
      const rek = [];
      if (data.asrama) {
        const asramaRendah = data.asrama.filter(a => parseFloat(a.persentase) < 80 && a.totalMahasiswa > 0);
        if (asramaRendah.length > 0) {
          rek.push(`Tingkatkan evaluasi dan pemantauan absensi di asrama dengan persentase kehadiran di bawah 80%: ${asramaRendah.map(a => a.nama).join(', ')}.`);
        }
      }
      if (data.perizinan && data.perizinan.terlambat > 0) {
        rek.push(`Terdapat ${data.perizinan.terlambat} mahasiswa yang terlambat kembali ke asrama. Segera lakukan tindak lanjut melalui fasilitator asrama terkait.`);
      }
      if (data.perhatianKhusus && data.perhatianKhusus.length > 0) {
        rek.push(`Terdapat ${data.perhatianKhusus.length} mahasiswa dalam status peringatan. Jadwalkan sesi konseling khusus.`);
      }
      if (rek.length === 0) {
        rek.push('Secara umum, tingkat partisipasi dan kepatuhan mahasiswa sudah berada dalam batas aman. Lanjutkan program pembinaan seperti biasa.');
      }
      data.rekomendasi = rek;
    }

    // --- VALIDASI: Cek apakah ada aktivitas di periode ini ---
    const kegiatanCount  = await prisma.kegiatanPembinaan.count({
      where: { tanggal_kegiatan: { gte: startDate, lte: endDate } }
    });
    const perizinanCount = await prisma.perizinan.count({
      where: { tanggal_pengajuan: { gte: startDate, lte: endDate } }
    });
    const rekapCount     = await prisma.rekapAbsensi.count({
      where: { bulan: targetMonth, tahun: targetYear }
    });

    const adaAktivitas = kegiatanCount > 0 || perizinanCount > 0 || rekapCount > 0;

    if (!adaAktivitas) {
      return res.status(400).json({
        success: false,
        message: 'Periode yang dipilih belum memiliki aktivitas.'
      });
    }

    // ========================================================================
    // EXPORT TO EXCEL
    // ========================================================================
    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SIMBIMA - Andalas Residence';
      workbook.created = new Date();

      // Load logo image sekali untuk semua sheet
      let logoImageId = null;
      if (LOGO_EXISTS) {
        logoImageId = workbook.addImage({
          filename: LOGO_PATH,
          extension: 'png',
        });
      }

      // ── Helper: buat worksheet dengan kop surat ──────────────────────────
      const makeSheet = async (name) => {
        const ws = workbook.addWorksheet(name);
        await addKopSuratExcel(ws, workbook, logoImageId, periodeLabel);
        return ws;
      };

      // ── Helper: tambahkan header row di bawah kop ────────────────────────
      const styleHeaderRow = (ws) => {
        const headerRowNum = ws.actualRowCount; // baris terakhir = baris header
        const headerRow = ws.getRow(headerRowNum);
        headerRow.font   = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
        headerRow.height = 18;
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      };

      // ── Cover Sheet ───────────────────────────────────────────────────────
      const cover = workbook.addWorksheet('Cover');
      cover.getColumn(1).width = 50;
      cover.getColumn(2).width = 40;
      await addKopSuratExcel(cover, workbook, logoImageId, periodeLabel);

      // Data cover di bawah kop (baris 10+)
      const addCoverRow = (label, value) => {
        const r = cover.addRow([label, value]);
        r.getCell(1).font = { bold: true };
        r.height = 16;
      };
      cover.addRow([]);
      addCoverRow('Judul Laporan', 'Laporan Monitoring Asrama SIMBIMA');
      addCoverRow('Periode',       periodeLabel);
      addCoverRow('Tanggal Cetak', formatDate(data.timestamp));
      addCoverRow('Dicetak Oleh',  'Ketua Pokja Asrama / Superadmin');

      // ── Ringkasan Umum ────────────────────────────────────────────────────
      if (data.summary) {
        const ws = await makeSheet('Ringkasan Umum');
        ws.columns = [
          { header: 'Indikator', key: 'indikator', width: 40 },
          { header: 'Jumlah',    key: 'jumlah',    width: 20 }
        ];
        styleHeaderRow(ws);
        ws.addRows([
          { indikator: 'Total Mahasiswa Aktif',           jumlah: data.summary.totalMahasiswa },
          { indikator: 'Total Gedung / Asrama',           jumlah: data.summary.totalGedung },
          { indikator: 'Total Fasilitator',               jumlah: data.summary.totalFasilitator },
          { indikator: 'Kapasitas Total Asrama',          jumlah: data.summary.totalKapasitas },
          { indikator: `Total Kegiatan (${data.periodeLabel || ''})`, jumlah: data.summary.totalKegiatanPeriode }
        ]);
      }

      // ── Kehadiran per Asrama ─────────────────────────────────────────────
      if (data.asrama) {
        const ws = await makeSheet('Kehadiran per Asrama');
        ws.columns = [
          { header: 'Nama Gedung',     key: 'nama',           width: 28 },
          { header: 'Total Mhs Aktif', key: 'totalMahasiswa', width: 16 },
          { header: 'Jml Kegiatan',    key: 'jumlahKegiatan', width: 14 },
          { header: 'Hadir',           key: 'hadir',          width: 12 },
          { header: 'Izin',            key: 'izin',           width: 12 },
          { header: 'Alpha',           key: 'alpha',          width: 12 },
          { header: 'Kehadiran %',     key: 'persentase',     width: 16 }
        ];
        styleHeaderRow(ws);
        data.asrama.forEach(a => ws.addRow({
          nama: a.nama, totalMahasiswa: a.totalMahasiswa,
          jumlahKegiatan: a.jumlahKegiatan,
          hadir: a.hadir, izin: a.izin, alpha: a.alpha, persentase: a.persentase
        }));
      }

      // ── Rekap Kegiatan ────────────────────────────────────────────────────
      if (data.kegiatan) {
        const ws = await makeSheet('Rekap Kegiatan');
        ws.columns = [
          { header: 'Nama Kegiatan',  key: 'nama',          width: 30 },
          { header: 'Jenis Kegiatan', key: 'jenisKegiatan', width: 22 },
          { header: 'Wajib/Tidak',    key: 'wajib',         width: 14 },
          { header: 'Gedung',         key: 'gedung',        width: 24 },
          { header: 'Tanggal',        key: 'tanggal',       width: 20 },
          { header: 'Status',         key: 'status',        width: 14 },
          { header: 'Hadir',          key: 'totalHadir',    width: 10 },
          { header: 'Izin',           key: 'totalIzin',     width: 10 },
          { header: 'Sakit',          key: 'totalSakit',    width: 10 },
          { header: 'Alpha',          key: 'totalAlpha',    width: 10 }
        ];
        styleHeaderRow(ws);
        data.kegiatan.forEach(k => ws.addRow(k));
      }

      // ── Rekap Perizinan ───────────────────────────────────────────────────
      if (data.perizinan) {
        const ws = await makeSheet('Rekap Perizinan');
        ws.columns = [
          { header: 'Keterangan', key: 'status', width: 32 },
          { header: 'Jumlah',     key: 'jumlah', width: 16 }
        ];
        styleHeaderRow(ws);
        ws.addRows([
          { status: 'Total Pengajuan Izin',   jumlah: data.perizinan.total },
          { status: '— Pulang Kampung',        jumlah: data.perizinan.pulangKampung },
          { status: '— Kegiatan di Luar',      jumlah: data.perizinan.kegiatanLuar },
          { status: '',                         jumlah: '' },
          { status: 'Disetujui',               jumlah: data.perizinan.disetujui },
          { status: 'Selesai (Sudah Kembali)', jumlah: data.perizinan.selesai },
          { status: 'Ditolak',                 jumlah: data.perizinan.ditolak },
          { status: 'Dibatalkan',              jumlah: data.perizinan.dibatalkan },
          { status: 'Menunggu Persetujuan',    jumlah: data.perizinan.menunggu },
          { status: 'Terlambat Kembali',       jumlah: data.perizinan.terlambat }
        ]);

        if (data.perizinan.daftarTerlambat.length > 0) {
          ws.addRow([]);
          const titleRow = ws.addRow(['Daftar Mahasiswa Terlambat Kembali ke Asrama']);
          titleRow.font = { bold: true, size: 11 };
          const subHeaderRow = ws.addRow([
            'Nama', 'NIM', 'Asrama', 'Jenis Izin', 'Durasi (Hari)', 'Tgl Mulai', 'Batas Kembali'
          ]);
          subHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          subHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5276' } };
          data.perizinan.daftarTerlambat.forEach(t => {
            ws.addRow([t.nama, t.nim, t.asrama, t.jenisIzin, t.durasi, t.tanggalMulai, t.tanggalSelesai]);
          });
        }
      }

      // ── Perhatian Khusus ──────────────────────────────────────────────────
      if (data.perhatianKhusus) {
        const ws = await makeSheet('Perhatian Khusus');
        ws.columns = [
          { header: 'Nama',                    key: 'nama',   width: 32 },
          { header: 'NIM',                     key: 'nim',    width: 22 },
          { header: 'Gedung',                  key: 'gedung', width: 26 },
          { header: 'Status Reward/Punishment', key: 'status', width: 26 }
        ];
        styleHeaderRow(ws);
        data.perhatianKhusus.forEach(p => ws.addRow(p));
      }

      // ── Rekomendasi ───────────────────────────────────────────────────────
      if (data.rekomendasi) {
        const ws = await makeSheet('Rekomendasi');
        ws.getColumn(1).width = 5;
        ws.getColumn(2).width = 90;
        const titleRow = ws.addRow(['', 'Rekomendasi Tindak Lanjut']);
        titleRow.getCell(2).font = { bold: true, size: 13, name: 'Times New Roman' };
        ws.addRow([]);
        data.rekomendasi.forEach((r, i) => {
          const row = ws.addRow([`${i + 1}.`, r]);
          row.getCell(2).alignment = { wrapText: true };
          row.height = 30;
        });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBaseName}.xlsx"`);
      return workbook.xlsx.write(res).then(() => res.end());
    }

    // ========================================================================
    // ========================================================================
    // EXPORT TO PDF
    // ========================================================================
    if (format === 'pdf') {
      const M   = PDF_MARGIN;  // 50 — margin kiri/kanan/atas/bawah seragam
      const PW  = 595.28;      // A4 width  (points)
      const PH  = 841.89;      // A4 height (points)
      const CW  = PW - M * 2; // content width = 495.28

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: M, bottom: M, left: M, right: M },
        bufferPages: true,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileBaseName}.pdf"`);
      doc.pipe(res);

      // ── Kop surat halaman pertama ──────────────────────────────────────────
      addKopSuratPDF(doc);

      // ── Kop surat otomatis di setiap halaman baru ─────────────────────────
      doc.on('pageAdded', () => addKopSuratPDF(doc));

      // ======================================================================
      // HELPER: Tabel manual dengan grid hitam solid
      // cols = array of { header, width, align: 'left'|'center'|'right' }
      // rows = array of array string
      // ======================================================================
      const ROW_H  = 18;  // tinggi baris data
      const HDR_H  = 20;  // tinggi baris header
      const CELL_PAD = 4; // padding dalam sel

      function drawTable(cols, rows) {
        const tableW  = cols.reduce((s, c) => s + c.width, 0);
        const startX  = M;

        // Cek apakah header muat di halaman ini
        const spaceNeeded = HDR_H + ROW_H; // minimal 1 baris + header
        if (doc.y + spaceNeeded > PH - M - 20) {
          doc.addPage();
        }

        let curY = doc.y;

        // ── Header ──────────────────────────────────────────────────────────
        let cx = startX;
        cols.forEach(col => {
          // Background abu-abu sangat muda untuk header
          doc.rect(cx, curY, col.width, HDR_H)
             .fillColor('#F2F2F2').fill()
             .rect(cx, curY, col.width, HDR_H)
             .lineWidth(0.5).strokeColor('#000000').stroke();
          doc.font('Times-Bold').fontSize(10).fillColor('#000000')
             .text(col.header, cx + CELL_PAD, curY + 5, {
               width: col.width - CELL_PAD * 2,
               align: col.align || 'left',
               lineBreak: false
             });
          cx += col.width;
        });
        curY += HDR_H;

        // ── Baris data ───────────────────────────────────────────────────────
        rows.forEach(row => {
          // Pindah halaman jika tidak muat
          if (curY + ROW_H > PH - M - 20) {
            doc.addPage();
            curY = doc.y;

            // Ulangi header di halaman baru
            let hx = startX;
            cols.forEach(col => {
              doc.rect(hx, curY, col.width, HDR_H)
                 .fillColor('#F2F2F2').fill()
                 .rect(hx, curY, col.width, HDR_H)
                 .lineWidth(0.5).strokeColor('#000000').stroke();
              doc.font('Times-Bold').fontSize(10).fillColor('#000000')
                 .text(col.header, hx + CELL_PAD, curY + 5, {
                   width: col.width - CELL_PAD * 2,
                   align: col.align || 'left',
                   lineBreak: false
                 });
              hx += col.width;
            });
            curY += HDR_H;
          }

          let rx = startX;
          cols.forEach((col, ci) => {
            doc.rect(rx, curY, col.width, ROW_H)
               .fillColor('#FFFFFF').fill()
               .rect(rx, curY, col.width, ROW_H)
               .lineWidth(0.5).strokeColor('#000000').stroke();
            doc.font('Times-Roman').fontSize(10).fillColor('#000000')
               .text(row[ci] ?? '', rx + CELL_PAD, curY + 4, {
                 width: col.width - CELL_PAD * 2,
                 align: col.align || 'left',
                 lineBreak: false
               });
            rx += col.width;
          });
          curY += ROW_H;
        });

        // Set posisi Y ke bawah tabel
        doc.y = curY;
        doc.x = M;
      }

      // ── Helper section title ───────────────────────────────────────────────
      let sectionNum = 0;
      const sectionTitle = (title) => {
        sectionNum++;
        // Cek apakah judul + minimal 1 baris muat
        if (doc.y + 40 > PH - M) doc.addPage();
        doc.font('Times-Bold').fontSize(12).fillColor('#000000')
           .text(`${sectionNum}. ${title}`, M, doc.y, { width: CW });
        doc.y += 8; // jarak 8pt antara judul dan tabel
      };

      // ── 1. Ringkasan Umum ──────────────────────────────────────────────────
      if (data.summary) {
        sectionTitle('Ringkasan Umum');
        drawTable(
          [
            { header: 'Indikator', width: 360, align: 'left'  },
            { header: 'Jumlah',    width: 135, align: 'center' },
          ],
          [
            ['Total Mahasiswa Aktif',                        data.summary.totalMahasiswa.toString()],
            ['Total Gedung / Asrama',                        data.summary.totalGedung.toString()],
            ['Total Fasilitator',                            data.summary.totalFasilitator.toString()],
            ['Kapasitas Total Asrama',                       data.summary.totalKapasitas.toString()],
            [`Total Kegiatan Periode ${periodeLabel}`,       data.summary.totalKegiatanPeriode.toString()],
          ]
        );
        doc.y += 20;
      }

      // ── 2. Kehadiran per Asrama ────────────────────────────────────────────
      if (data.asrama && data.asrama.length > 0) {
        sectionTitle('Kehadiran per Asrama');
        drawTable(
          [
            { header: 'Nama Asrama',   width: 150, align: 'left'   },
            { header: 'Mhs Aktif',     width:  60, align: 'center'  },
            { header: 'Jml Kegiatan',  width:  65, align: 'center'  },
            { header: 'Hadir',         width:  55, align: 'center'  },
            { header: 'Izin',          width:  50, align: 'center'  },
            { header: 'Alpha',         width:  55, align: 'center'  },
            { header: 'Kehadiran %',   width:  60, align: 'center'  },
          ],
          data.asrama.map(a => [
            a.nama,
            a.totalMahasiswa.toString(),
            a.jumlahKegiatan.toString(),
            a.hadir.toString(),
            a.izin.toString(),
            a.alpha.toString(),
            a.persentase,
          ])
        );
        doc.y += 20;
      }

      // ── 3. Rekap Perizinan ─────────────────────────────────────────────────
      if (data.perizinan) {
        sectionTitle('Rekap Perizinan');
        drawTable(
          [
            { header: 'Keterangan',  width: 360, align: 'left'   },
            { header: 'Jumlah',      width: 135, align: 'center' },
          ],
          [
            ['Total Pengajuan Izin',              data.perizinan.total.toString()],
            ['  — Pulang Kampung',                data.perizinan.pulangKampung.toString()],
            ['  — Kegiatan di Luar',              data.perizinan.kegiatanLuar.toString()],
            ['Disetujui',                         data.perizinan.disetujui.toString()],
            ['Selesai (Sudah Kembali)',           data.perizinan.selesai.toString()],
            ['Ditolak',                           data.perizinan.ditolak.toString()],
            ['Dibatalkan',                        data.perizinan.dibatalkan.toString()],
            ['Menunggu Persetujuan',              data.perizinan.menunggu.toString()],
            ['Terlambat Kembali ke Asrama',       data.perizinan.terlambat.toString()],
          ]
        );

        if (data.perizinan.daftarTerlambat.length > 0) {
          doc.y += 12;
          doc.font('Times-Bold').fontSize(11).fillColor('#000000')
             .text('Daftar Mahasiswa Terlambat Kembali ke Asrama', M, doc.y, { width: CW });
          doc.y += 8;
          drawTable(
            [
              { header: 'Nama',         width: 150, align: 'left'   },
              { header: 'NIM',          width:  95, align: 'center'  },
              { header: 'Asrama',       width:  90, align: 'left'    },
              { header: 'Jenis Izin',   width:  85, align: 'center'  },
              { header: 'Batas Kembali', width:  75, align: 'center' },
            ],
            data.perizinan.daftarTerlambat.map(t => [
              t.nama, t.nim, t.asrama, t.jenisIzin, t.tanggalSelesai
            ])
          );
        }
        doc.y += 20;
      }

      // ── 4. Mahasiswa Perhatian Khusus ──────────────────────────────────────
      if (data.perhatianKhusus && data.perhatianKhusus.length > 0) {
        sectionTitle('Mahasiswa Perhatian Khusus');
        drawTable(
          [
            { header: 'Nama',   width: 185, align: 'left'   },
            { header: 'NIM',    width: 110, align: 'center'  },
            { header: 'Asrama', width: 115, align: 'left'    },
            { header: 'Status', width:  85, align: 'center'  },
          ],
          data.perhatianKhusus.map(p => [p.nama, p.nim, p.gedung, p.status])
        );
        doc.y += 20;
      }

      // ── 5. Rekomendasi ─────────────────────────────────────────────────────
      if (data.rekomendasi && data.rekomendasi.length > 0) {
        sectionTitle('Rekomendasi Tindak Lanjut');
        data.rekomendasi.forEach((r, i) => {
          doc.font('Times-Roman').fontSize(11).fillColor('#000000')
             .text(`${i + 1}. ${r}`, M, doc.y, { width: CW, align: 'justify' });
          doc.y += 8;
        });
        doc.y += 15;
      }

      // ======================================================================
      // BLOK TANDA TANGAN
      // Dicek sisa ruang — jika < 130pt, pindah halaman agar tidak terpotong
      // ======================================================================
      const TINGGI_TTD = 130; // tinggi estimasi blok TTD
      const sisaRuang  = PH - doc.y - M;
      if (sisaRuang < TINGGI_TTD) {
        doc.addPage();
      }

      // Jarak sebelum TTD
      doc.y += 25;

      const ttdY   = doc.y;
      const leftX  = M;
      const rightX = PW - M - 190;

      // Baris 1: kota + tanggal (kanan) & "Mengetahui," (kiri)
      doc.font('Times-Roman').fontSize(11).fillColor('#000000');
      doc.text('Mengetahui,', leftX,  ttdY, { width: 220 });
      doc.text(`Padang, ${formatDate(new Date())}`, rightX, ttdY, { width: 190, align: 'center' });

      // Baris 2: jabatan
      doc.y = ttdY + 14;
      doc.text('Wakil Rektor Bidang Kemahasiswaan', leftX, doc.y, { width: 220 });
      doc.text('Ketua Pokja Asrama', rightX, doc.y, { width: 190, align: 'center' });

      // Ruang tanda tangan (60pt ≈ 2.1 cm)
      const signY = doc.y + 60;

      // Garis tanda tangan (0.5pt)
      doc.moveTo(leftX,  signY).lineTo(leftX  + 185, signY).lineWidth(0.5).strokeColor('#000000').stroke();
      doc.moveTo(rightX, signY).lineTo(rightX + 185, signY).lineWidth(0.5).stroke();

      // Nama (placeholder)
      doc.y = signY + 4;
      doc.font('Times-Bold').fontSize(11).fillColor('#000000');
      doc.text('(......................................)', leftX,  doc.y, { width: 220 });
      doc.text('(......................................)', rightX, doc.y, { width: 190, align: 'center' });

      // NIP
      doc.y += 14;
      doc.font('Times-Roman').fontSize(10).fillColor('#000000');
      doc.text('NIP. ................................', leftX,  doc.y, { width: 220 });
      doc.text('NIP. ................................', rightX, doc.y, { width: 190, align: 'center' });

      // ======================================================================
      // FOOTER: nomor halaman di setiap halaman
      // ======================================================================
      const range = doc.bufferedPageRange();
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        doc.font('Times-Roman').fontSize(9).fillColor('#444444')
           .text(
             `Halaman ${i + 1} dari ${range.count}  |  Periode: ${periodeLabel}  |  Dicetak oleh Ketua Pokja / Superadmin`,
             M,
             PH - M + 8,
             { align: 'center', width: CW }
           );
      }

      doc.end();
      return;
    }

    res.status(400).json({ success: false, message: 'Format tidak didukung' });

  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ success: false, message: 'Gagal menghasilkan laporan: ' + error.message });
  }
};
