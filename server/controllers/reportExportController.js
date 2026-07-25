const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');

// Format tanggal helper
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};

exports.exportLaporanMonitoring = async (req, res) => {
  try {
    const { periode, format, sections } = req.query;
    
    // Default to current month if periode is missing
    const targetDate = periode ? new Date(periode + '-01') : new Date();
    const targetMonth = targetDate.getMonth() + 1;
    const targetYear = targetDate.getFullYear();
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    // Normalize sections array
    let activeSections = [];
    if (Array.isArray(sections)) {
      activeSections = sections;
    } else if (typeof sections === 'string') {
      activeSections = [sections];
    } else {
      activeSections = ['summary', 'asrama', 'kegiatan', 'perizinan', 'perhatian-khusus', 'rekomendasi'];
    }

    // --- DATA GATHERING ---
    const data = {
      periodeLabel: `${targetDate.toLocaleString('id-ID', { month: 'long' })} ${targetYear}`,
      timestamp: new Date()
    };

    // 1. Summary
    if (activeSections.includes('summary')) {
      const [totalGedung, totalMahasiswa, totalFasilitator, kapResult] = await Promise.all([
        prisma.gedung.count({ where: { status_gedung: 'AKTIF' } }),
        prisma.mahasiswa.count({ where: { status_hunian: 'AKTIF' } }),
        prisma.fasilitator.count(),
        prisma.gedung.aggregate({ _sum: { kapasitas_mahasiswa: true }, where: { status_gedung: 'AKTIF' } })
      ]);
      data.summary = {
        totalGedung,
        totalMahasiswa,
        totalFasilitator,
        totalKapasitas: kapResult._sum.kapasitas_mahasiswa || 0
      };
    }

    // 2. Kehadiran per Asrama
    if (activeSections.includes('asrama')) {
      const gedungs = await prisma.gedung.findMany({
        where: { status_gedung: 'AKTIF' },
        include: {
          mahasiswas: { where: { status_hunian: 'AKTIF' }, select: { id_mahasiswa: true } },
          rekaps: {
            where: { bulan: targetMonth, tahun: targetYear }
          }
        }
      });
      data.asrama = gedungs.map(g => {
        const totalMahasiswa = g.mahasiswas.length;
        const totalHadir = g.rekaps.reduce((acc, r) => acc + r.total_hadir, 0);
        const totalIzin   = g.rekaps.reduce((acc, r) => acc + r.total_izin,  0);
        const totalAlpha  = g.rekaps.reduce((acc, r) => acc + r.total_alpha, 0);
        const totalSemua  = totalHadir + totalIzin + totalAlpha;
        const persentase  = totalSemua > 0 ? ((totalHadir / totalSemua) * 100).toFixed(2) : 0;
        return {
          nama: g.nama_gedung,
          totalMahasiswa,
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
        where: {
          tanggal_kegiatan: { gte: startDate, lte: endDate }
        },
        include: {
          gedung: true,
          kehadirans: true
        }
      });
      data.kegiatan = kegiatans.map(k => ({
        nama: k.nama_kegiatan,
        gedung: k.gedung.nama_gedung,
        tanggal: formatDate(k.tanggal_kegiatan),
        status: k.status_kegiatan,
        totalHadir: k.kehadirans.filter(h => h.status_kehadiran === 'HADIR').length,
        totalAlpha: k.kehadirans.filter(h => h.status_kehadiran === 'ALPHA').length,
        totalIzin:  k.kehadirans.filter(h => h.status_kehadiran === 'IZIN').length,
      }));
    }

    // 4. Rekap Perizinan
    if (activeSections.includes('perizinan')) {
      const perizinans = await prisma.perizinan.findMany({
        where: {
          tanggal_pengajuan: { gte: startDate, lte: endDate }
        },
        include: { mahasiswa: true }
      });
      
      const disetujui = perizinans.filter(p => p.status_pengajuan === 'DISETUJUI').length;
      const ditolak   = perizinans.filter(p => p.status_pengajuan === 'DITOLAK').length;
      const menunggu  = perizinans.filter(p => p.status_pengajuan === 'MENUNGGU').length;
      const selesai   = perizinans.filter(p => p.status_pengajuan === 'SELESAI').length;
      const dibatalkan = perizinans.filter(p => p.status_pengajuan === 'DIBATALKAN').length;
      
      const now = new Date();
      const terlambat = perizinans.filter(p => 
        p.status_pengajuan === 'DISETUJUI' && 
        new Date(p.tanggal_selesai) < now && 
        !p.returned_at
      );

      data.perizinan = {
        total: perizinans.length,
        disetujui, ditolak, menunggu, selesai, dibatalkan,
        terlambat: terlambat.length,
        daftarTerlambat: terlambat.map(t => ({
          nama: t.mahasiswa.nama,
          nim: t.mahasiswa.nim,
          durasi: t.durasi_hari,
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

    // 6. Rekomendasi (Simple logic)
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
    const kegiatanCount = await prisma.kegiatanPembinaan.count({
      where: { tanggal_kegiatan: { gte: startDate, lte: endDate } }
    });
    const perizinanCount = await prisma.perizinan.count({
      where: { tanggal_pengajuan: { gte: startDate, lte: endDate } }
    });
    const rekapCount = await prisma.rekapAbsensi.count({
      where: { bulan: targetMonth, tahun: targetYear }
    });

    const adaAktivitas = kegiatanCount > 0 || perizinanCount > 0 || rekapCount > 0;

    if (!adaAktivitas) {
      return res.status(400).json({
        success: false,
        message: 'Periode yang dipilih belum memiliki aktivitas.'
      });
    }

    // --- EXPORT TO EXCEL ---
    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'SIMBIMA';
      workbook.created = new Date();

      // Cover
      const cover = workbook.addWorksheet('Cover');
      cover.getColumn(1).width = 40;
      cover.addRow(['LAPORAN MONITORING ASRAMA SIMBIMA']).font = { size: 16, bold: true };
      cover.addRow([]);
      cover.addRow(['Periode', data.periodeLabel]);
      cover.addRow(['Tanggal Cetak', formatDate(data.timestamp)]);
      cover.addRow(['Dicetak Oleh', 'Ketua Pokja Asrama / Superadmin']);
      
      // Summary
      if (data.summary) {
        const ws = workbook.addWorksheet('Ringkasan Umum');
        ws.columns = [
          { header: 'Indikator', key: 'indikator', width: 30 },
          { header: 'Jumlah', key: 'jumlah', width: 20 }
        ];
        ws.getRow(1).font = { bold: true };
        ws.addRows([
          { indikator: 'Total Mahasiswa Aktif', jumlah: data.summary.totalMahasiswa },
          { indikator: 'Total Gedung / Asrama', jumlah: data.summary.totalGedung },
          { indikator: 'Total Fasilitator', jumlah: data.summary.totalFasilitator },
          { indikator: 'Kapasitas Total', jumlah: data.summary.totalKapasitas }
        ]);
      }

      // Asrama
      if (data.asrama) {
        const ws = workbook.addWorksheet('Kehadiran per Asrama');
        ws.columns = [
          { header: 'Nama Gedung', key: 'nama', width: 25 },
          { header: 'Total Mhs', key: 'total', width: 15 },
          { header: 'Hadir', key: 'hadir', width: 10 },
          { header: 'Izin', key: 'izin', width: 10 },
          { header: 'Alpha', key: 'alpha', width: 10 },
          { header: 'Persentase', key: 'persentase', width: 15 }
        ];
        ws.getRow(1).font = { bold: true };
        data.asrama.forEach(a => ws.addRow({
          nama: a.nama, total: a.totalMahasiswa, hadir: a.hadir, izin: a.izin, alpha: a.alpha, persentase: a.persentase
        }));
      }

      // Kegiatan
      if (data.kegiatan) {
        const ws = workbook.addWorksheet('Rekap Kegiatan');
        ws.columns = [
          { header: 'Nama Kegiatan', key: 'nama',       width: 30 },
          { header: 'Gedung',        key: 'gedung',     width: 25 },
          { header: 'Tanggal',       key: 'tanggal',    width: 20 },
          { header: 'Status',        key: 'status',     width: 15 },
          { header: 'Total Hadir',   key: 'totalHadir', width: 15 },
          { header: 'Total Alpha',   key: 'totalAlpha', width: 15 },
          { header: 'Total Izin',    key: 'totalIzin',  width: 15 }
        ];
        ws.getRow(1).font = { bold: true };
        data.kegiatan.forEach(k => ws.addRow(k));
      }

      // Perizinan
      if (data.perizinan) {
        const ws = workbook.addWorksheet('Rekap Perizinan');
        ws.columns = [
          { header: 'Status Pengajuan', key: 'status', width: 25 },
          { header: 'Jumlah', key: 'jumlah', width: 15 }
        ];
        ws.getRow(1).font = { bold: true };
        ws.addRows([
          { status: 'Total Pengajuan',  jumlah: data.perizinan.total },
          { status: 'Disetujui',        jumlah: data.perizinan.disetujui },
          { status: 'Selesai',          jumlah: data.perizinan.selesai },
          { status: 'Ditolak',          jumlah: data.perizinan.ditolak },
          { status: 'Dibatalkan',       jumlah: data.perizinan.dibatalkan },
          { status: 'Menunggu',         jumlah: data.perizinan.menunggu },
          { status: 'Terlambat Balik',  jumlah: data.perizinan.terlambat }
        ]);

        if (data.perizinan.daftarTerlambat.length > 0) {
          ws.addRow([]);
          ws.addRow(['Daftar Mahasiswa Terlambat']).font = { bold: true };
          ws.addRow(['Nama', 'NIM', 'Durasi Izin (Hari)', 'Batas Kembali']).font = { bold: true };
          data.perizinan.daftarTerlambat.forEach(t => {
            ws.addRow([t.nama, t.nim, t.durasi, t.tanggalSelesai]);
          });
        }
      }

      // Perhatian Khusus
      if (data.perhatianKhusus) {
        const ws = workbook.addWorksheet('Perhatian Khusus');
        ws.columns = [
          { header: 'Nama', key: 'nama', width: 30 },
          { header: 'NIM', key: 'nim', width: 20 },
          { header: 'Gedung', key: 'gedung', width: 25 },
          { header: 'Status Reward/Punishment', key: 'status', width: 25 }
        ];
        ws.getRow(1).font = { bold: true };
        data.perhatianKhusus.forEach(p => ws.addRow(p));
      }

      // Rekomendasi
      if (data.rekomendasi) {
        const ws = workbook.addWorksheet('Rekomendasi');
        ws.getColumn(1).width = 100;
        ws.addRow(['Rekomendasi Tindak Lanjut']).font = { bold: true, size: 14 };
        ws.addRow([]);
        data.rekomendasi.forEach((r, i) => {
          ws.addRow([`${i + 1}. ${r}`]);
        });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Laporan_Monitoring_${targetYear}_${targetMonth}.xlsx"`);
      return workbook.xlsx.write(res).then(() => res.end());
    }

    // --- EXPORT TO PDF ---
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Laporan_Monitoring_${targetYear}_${targetMonth}.pdf"`);
      doc.pipe(res);

      // Header
      doc.fontSize(20).text('SIMBIMA', { align: 'center' });
      doc.fontSize(14).text('Laporan Monitoring Asrama Universitas Andalas', { align: 'center' });
      doc.fontSize(12).text(`Periode: ${data.periodeLabel}`, { align: 'center' });
      doc.moveDown(2);

      // 1. Summary
      if (data.summary) {
        doc.fontSize(14).font('Helvetica-Bold').text('1. Ringkasan Umum').font('Helvetica');
        doc.moveDown(0.5);
        const table = {
          headers: ['Indikator', 'Jumlah'],
          rows: [
            ['Total Mahasiswa Aktif', data.summary.totalMahasiswa.toString()],
            ['Total Gedung / Asrama', data.summary.totalGedung.toString()],
            ['Total Fasilitator', data.summary.totalFasilitator.toString()],
            ['Kapasitas Total', data.summary.totalKapasitas.toString()]
          ]
        };
        await doc.table(table, { width: 300 });
        doc.moveDown(1);
      }

      // 2. Kehadiran per Asrama
      if (data.asrama && data.asrama.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('2. Kehadiran per Asrama').font('Helvetica');
        doc.moveDown(0.5);
        const table = {
          headers: ['Asrama', 'Mahasiswa', 'Hadir', 'Izin', 'Alpha', '%'],
          rows: data.asrama.map(a => [
            a.nama, a.totalMahasiswa.toString(), a.hadir.toString(), 
            a.izin.toString(), a.alpha.toString(), a.persentase
          ])
        };
        await doc.table(table, { width: 500 });
        doc.moveDown(1);
      }

      // 3. Perizinan
      if (data.perizinan) {
        doc.fontSize(14).font('Helvetica-Bold').text('3. Rekap Perizinan').font('Helvetica');
        doc.moveDown(0.5);
        const table = {
          headers: ['Status', 'Jumlah'],
          rows: [
            ['Total Pengajuan', data.perizinan.total.toString()],
            ['Disetujui', data.perizinan.disetujui.toString()],
            ['Terlambat Balik', data.perizinan.terlambat.toString()]
          ]
        };
        await doc.table(table, { width: 300 });
        
        if (data.perizinan.daftarTerlambat.length > 0) {
          doc.moveDown(1);
          doc.fontSize(12).font('Helvetica-Bold').text('Daftar Mahasiswa Terlambat Kembali').font('Helvetica');
          doc.moveDown(0.5);
          const tableTerlambat = {
            headers: ['Nama', 'NIM', 'Batas Waktu'],
            rows: data.perizinan.daftarTerlambat.map(t => [t.nama, t.nim, t.tanggalSelesai])
          };
          await doc.table(tableTerlambat, { width: 500 });
        }
        doc.moveDown(1);
      }

      // 4. Perhatian Khusus
      if (data.perhatianKhusus && data.perhatianKhusus.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('4. Mahasiswa Perhatian Khusus').font('Helvetica');
        doc.moveDown(0.5);
        const table = {
          headers: ['Nama', 'NIM', 'Asrama', 'Status'],
          rows: data.perhatianKhusus.map(p => [p.nama, p.nim, p.gedung, p.status])
        };
        await doc.table(table, { width: 500 });
        doc.moveDown(1);
      }

      // 5. Rekomendasi
      if (data.rekomendasi && data.rekomendasi.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('5. Rekomendasi').font('Helvetica');
        doc.moveDown(0.5);
        data.rekomendasi.forEach((r, i) => {
          doc.fontSize(12).text(`${i + 1}. ${r}`);
        });
      }

      // Footer
      let pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(10).text(
          `Halaman ${i + 1} dari ${pages.count} - Dicetak oleh Ketua Pokja / Superadmin`,
          40, doc.page.height - 40,
          { align: 'center' }
        );
      }

      doc.end();
      return;
    }

    res.status(400).json({ success: false, message: 'Format tidak didukung' });

  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ success: false, message: 'Gagal menghasilkan laporan' });
  }
};
