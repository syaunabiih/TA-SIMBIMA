/**
 * seed_dashboard_dummy.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Mengisi data dummy:
 *   - 12 Kegiatan (Gedung F / Asrama Oren) — tersebar 2 bulan terakhir + hari ini
 *   - Data Kehadiran realistis untuk semua mahasiswa per kegiatan
 *   - 6 Perizinan dengan status bervariasi
 *
 * Jalankan: node prisma/seed_dashboard_dummy.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function tgl(dayOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Memulai seed data dummy dashboard...\n');

  // ── Ambil fasilitator Gedung F ─────────────────────────────────────────────
  const gedungF = await prisma.gedung.findFirst({ where: { kode_gedung: 'F' } });
  if (!gedungF) {
    console.error('❌ Gedung F tidak ditemukan! Jalankan seed.js terlebih dahulu.');
    process.exit(1);
  }
  const id_gedung = gedungF.id_gedung;

  const fasilitators = await prisma.fasilitator.findMany({ where: { id_gedung } });
  if (!fasilitators.length) {
    console.error('❌ Tidak ada fasilitator di Gedung F!');
    process.exit(1);
  }
  const fasil = fasilitators[0];

  // ── Ambil mahasiswa Gedung F ───────────────────────────────────────────────
  const allMhs = await prisma.mahasiswa.findMany({
    where: { id_gedung, status_hunian: 'AKTIF' },
    take: 50
  });
  if (allMhs.length < 5) {
    console.error('❌ Mahasiswa di Gedung F terlalu sedikit! Jalankan seed.js terlebih dahulu.');
    process.exit(1);
  }

  console.log(`✅ Ditemukan ${allMhs.length} mahasiswa di Gedung F`);
  console.log(`✅ Menggunakan fasilitator: ${fasil.nama}\n`);

  // ── Ambil / buat Tahun Akademik Aktif ─────────────────────────────────────
  let tahunAktif = await prisma.tahunAkademik.findFirst({ where: { is_aktif: true } });
  if (!tahunAktif) {
    tahunAktif = await prisma.tahunAkademik.create({
      data: { nama: '2024/2025 Genap', is_aktif: true }
    });
    console.log('✅ Tahun Akademik "2024/2025 Genap" dibuat dan diaktifkan');
  } else {
    console.log(`✅ Tahun Akademik aktif: ${tahunAktif.nama}`);
  }

  // ── Hapus kegiatan & kehadiran lama milik Gedung F ────────────────────────
  const kegiatanLama = await prisma.kegiatanPembinaan.findMany({ where: { id_gedung } });
  const idKegiatanLama = kegiatanLama.map(k => k.id_kegiatan);
  if (idKegiatanLama.length) {
    await prisma.kehadiran.deleteMany({ where: { id_kegiatan: { in: idKegiatanLama } } });
    await prisma.petugasAbsensi.deleteMany({ where: { id_kegiatan: { in: idKegiatanLama } } });
    await prisma.kegiatanPembinaan.deleteMany({ where: { id_gedung } });
    console.log(`🧹 ${idKegiatanLama.length} kegiatan lama Gedung F dihapus`);
  }

  // Hapus perizinan lama mahasiswa Gedung F
  const mhsIds = allMhs.map(m => m.id_mahasiswa);
  await prisma.konfirmasiPerizinan.deleteMany({ where: { perizinan: { id_mahasiswa: { in: mhsIds } } } });
  await prisma.perizinan.deleteMany({ where: { id_mahasiswa: { in: mhsIds } } });
  console.log('🧹 Perizinan lama mahasiswa Gedung F dihapus\n');

  // ── Definisi Kegiatan ──────────────────────────────────────────────────────
  //  14 kegiatan WAJIB: tersebar di 10 tanggal berbeda (Subuh Berjamaah + Absen Malam)
  const kegiatanDef = [
    // Tanggal -42
    { nama: 'Shalat Subuh Berjamaah', jenisDef: 'Shalat Subuh Berjamaah', dayOff: -42, mulai: '05:00', selesai: '06:00', lokasi: 'Musholla Asrama Oren', status: 'SELESAI' },
    // Tanggal -35
    { nama: 'Absensi Malam',          jenisDef: 'Absen Malam',             dayOff: -35, mulai: '21:00', selesai: '21:30', lokasi: 'Koridor Asrama Oren', status: 'SELESAI' },
    // Tanggal -28
    { nama: 'Shalat Subuh Berjamaah', jenisDef: 'Shalat Subuh Berjamaah', dayOff: -28, mulai: '05:00', selesai: '06:00', lokasi: 'Musholla Asrama Oren', status: 'SELESAI' },
    // Tanggal -21
    { nama: 'Absensi Malam',          jenisDef: 'Absen Malam',             dayOff: -21, mulai: '21:00', selesai: '21:30', lokasi: 'Koridor Lantai 1-5',  status: 'SELESAI' },
    // Tanggal -17
    { nama: 'Shalat Subuh Berjamaah', jenisDef: 'Shalat Subuh Berjamaah', dayOff: -17, mulai: '05:00', selesai: '06:00', lokasi: 'Musholla Asrama Oren', status: 'SELESAI' },
    // Tanggal -14
    { nama: 'Absensi Malam',          jenisDef: 'Absen Malam',             dayOff: -14, mulai: '21:00', selesai: '21:30', lokasi: 'Koridor Lantai 1-5',  status: 'SELESAI' },
    // Tanggal -10
    { nama: 'Shalat Subuh Berjamaah', jenisDef: 'Shalat Subuh Berjamaah', dayOff: -10, mulai: '05:00', selesai: '06:00', lokasi: 'Musholla Asrama Oren', status: 'SELESAI' },
    // Tanggal -7
    { nama: 'Absensi Malam',          jenisDef: 'Absen Malam',             dayOff:  -7, mulai: '21:00', selesai: '21:30', lokasi: 'Koridor Asrama Oren', status: 'SELESAI' },
    // Tanggal -4
    { nama: 'Shalat Subuh Berjamaah', jenisDef: 'Shalat Subuh Berjamaah', dayOff:  -4, mulai: '05:00', selesai: '06:00', lokasi: 'Musholla Asrama Oren', status: 'SELESAI' },
    // Tanggal -2
    { nama: 'Absensi Malam',          jenisDef: 'Absen Malam',             dayOff:  -2, mulai: '21:00', selesai: '21:30', lokasi: 'Koridor Lantai 1-5',  status: 'SELESAI' },
    // Hari ini & besok (BERLANGSUNG — tidak ada kehadiran)
    { nama: 'Shalat Subuh Berjamaah', jenisDef: 'Shalat Subuh Berjamaah', dayOff:   0, mulai: '05:00', selesai: '06:00', lokasi: 'Musholla Asrama Oren', status: 'BERLANGSUNG' },
    { nama: 'Absensi Malam',          jenisDef: 'Absen Malam',             dayOff:   7, mulai: '21:00', selesai: '21:30', lokasi: 'Koridor Asrama Oren', status: 'BERLANGSUNG' },
  ];


  // ── Ambil jenis kegiatan (buat map by nama) ───────────────────────────────
  const jenisKeg = await prisma.jenisKegiatan.findMany();
  const jenisMap = {};
  jenisKeg.forEach(j => jenisMap[j.nama_jenis] = j.id_jenis_kegiatan);
  console.log('✅ Jenis kegiatan tersedia:', Object.keys(jenisMap).join(', '));

  const kegiatanDibuat = [];

  for (const def of kegiatanDef) {
    const tanggal = tgl(def.dayOff);
    const [jm, jt] = def.mulai.split(':').map(Number);
    const [sm, st] = def.selesai.split(':').map(Number);
    const id_jenis = jenisMap[def.jenisDef] || null;

    const kegiatan = await prisma.kegiatanPembinaan.create({
      data: {
        nama_kegiatan:    def.nama,
        tanggal_kegiatan: tanggal,
        waktu_mulai:      new Date(1970, 0, 1, jm, jt, 0),
        waktu_selesai:    new Date(1970, 0, 1, sm, st, 0),
        lokasi:           def.lokasi,
        status_kegiatan:  def.status,
        id_gedung,
        id_fasilitator:   fasil.id_fasilitator,
        id_jenis_kegiatan: id_jenis,
      }
    });
    kegiatanDibuat.push({ kegiatan, def });
  }
  console.log(`✅ ${kegiatanDibuat.length} kegiatan berhasil dibuat (${kegiatanDef.filter(k => jenisMap[k.jenisDef] && jenisKeg.find(j => j.id_jenis_kegiatan === jenisMap[k.jenisDef])?.is_wajib).length} kegiatan wajib)`);

  // ── Buat Kehadiran realistis ───────────────────────────────────────────────
  //  Kegiatan SELESAI → isi kehadiran semua mahasiswa
  //  Kegiatan hari ini/besok → tidak ada kehadiran (belum terjadi)
  let totalKehadiran = 0;

  // Bobot kehadiran per mahasiswa: agar ada variasi top 5
  // 10 mhs paling rajin → 85-95% hadir, sisanya acak
  const mhsBobot = allMhs.map((m, i) => ({
    mhs: m,
    bobot: i < 5 ? 0.92 : i < 10 ? 0.80 : i < 20 ? 0.70 : 0.55
  }));

  for (const { kegiatan, def } of kegiatanDibuat) {
    if (def.status !== 'SELESAI') continue; // skip kegiatan yg belum selesai

    const kehadiranBatch = [];
    for (const { mhs, bobot } of mhsBobot) {
      const roll = Math.random();
      let status_kehadiran;
      if (roll < bobot) {
        status_kehadiran = 'HADIR';
      } else if (roll < bobot + 0.10) {
        status_kehadiran = 'IZIN';
      } else if (roll < bobot + 0.15) {
        status_kehadiran = 'SAKIT';
      } else {
        status_kehadiran = 'ALPHA';
      }

      kehadiranBatch.push({
        id_kegiatan:      kegiatan.id_kegiatan,
        id_mahasiswa:     mhs.id_mahasiswa,
        status_kehadiran,
        waktu_absen:      kegiatan.tanggal_kegiatan,
      });
    }

    await prisma.kehadiran.createMany({ data: kehadiranBatch, skipDuplicates: true });
    totalKehadiran += kehadiranBatch.length;
    process.stdout.write(`\r  Kehadiran dibuat: ${totalKehadiran}`);
  }
  console.log(`\n✅ Total ${totalKehadiran} record kehadiran dibuat`);

  // ── Perizinan (6 data bervariasi) ─────────────────────────────────────────
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const perizinanDef = [
    {
      mhsIdx: 15, jenis: 'PULANG_KAMPUNG', status: 'MENUNGGU',
      mulai: new Date(today.getTime() + 2 * 86400000),
      selesai: new Date(today.getTime() + 5 * 86400000),
      alasan: 'Menghadiri acara pernikahan saudara kandung di kampung halaman.',
    },
    {
      mhsIdx: 20, jenis: 'PULANG_KAMPUNG', status: 'MENUNGGU',
      mulai: new Date(today.getTime() + 1 * 86400000),
      selesai: new Date(today.getTime() + 3 * 86400000),
      alasan: 'Keperluan keluarga mendesak, orang tua sakit.',
    },
    {
      mhsIdx: 25, jenis: 'KEGIATAN_LUAR', status: 'MENUNGGU',
      mulai: new Date(today.getTime() + 3 * 86400000),
      selesai: new Date(today.getTime() + 4 * 86400000),
      alasan: 'Mengikuti kompetisi olimpiade matematika tingkat nasional.',
    },
    {
      mhsIdx: 30, jenis: 'PULANG_KAMPUNG', status: 'DISETUJUI',
      mulai: new Date(today.getTime() - 2 * 86400000),
      selesai: new Date(today.getTime() + 1 * 86400000),
      alasan: 'Pulang ke kampung halaman untuk mengurus administrasi keluarga.',
    },
    {
      mhsIdx: 35, jenis: 'PULANG_KAMPUNG', status: 'DISETUJUI',
      mulai: new Date(today.getTime() - 3 * 86400000),
      selesai: new Date(today.getTime() - 1 * 86400000),
      alasan: 'Menghadiri acara keluarga penting.',
    },
    {
      mhsIdx: 40, jenis: 'KEGIATAN_LUAR', status: 'DITOLAK',
      mulai: new Date(today.getTime() - 10 * 86400000),
      selesai: new Date(today.getTime() - 7 * 86400000),
      alasan: 'Mengikuti kegiatan himpunan mahasiswa di luar kota.',
    },
  ];

  let totalIzin = 0;
  for (const def of perizinanDef) {
    const mhs = allMhs[Math.min(def.mhsIdx, allMhs.length - 1)];
    const durasi = Math.round((def.selesai - def.mulai) / 86400000);

    const perizinan = await prisma.perizinan.create({
      data: {
        id_mahasiswa:          mhs.id_mahasiswa,
        jenis_izin:            def.jenis,
        tanggal_mulai:         def.mulai,
        tanggal_selesai:       def.selesai,
        durasi_hari:           durasi > 0 ? durasi : 1,
        alasan:                def.alasan,
        status_pengajuan:      def.status,
        tanggal_pengajuan:     new Date(def.mulai.getTime() - 2 * 86400000),
        id_fasilitator_validasi: def.status !== 'MENUNGGU' ? fasil.id_fasilitator : null,
        tanggal_validasi:      def.status !== 'MENUNGGU' ? new Date() : null,
        catatan_fasilitator:   def.status === 'DITOLAK' ? 'Kuota izin sudah habis untuk periode ini.' : null,
      }
    });

    // Jika DISETUJUI, tambah konfirmasi berangkat
    if (def.status === 'DISETUJUI') {
      await prisma.konfirmasiPerizinan.create({
        data: {
          id_perizinan:       perizinan.id_perizinan,
          jenis_konfirmasi:   'SAMPAI_TUJUAN',
          tanggal_konfirmasi: new Date(def.mulai.getTime() + 3600000),
          keterangan:         'Sudah sampai di tujuan dengan selamat.',
        }
      });
    }

    totalIzin++;
    console.log(`  ✅ Izin #${totalIzin}: ${mhs.nama} — ${def.jenis} (${def.status})`);
  }

  // ── Update 3 mahasiswa agar alfa 3x berturut ───────────────────────────────
  // Ini untuk mengisi bagian "Perlu Perhatian" di dashboard
  // Ambil 3 kegiatan SELESAI terbaru
  const keg3Terakhir = kegiatanDibuat
    .filter(k => k.def.status === 'SELESAI')
    .slice(-3)
    .map(k => k.kegiatan);

  if (keg3Terakhir.length === 3) {
    const mhsAlfa = allMhs.slice(45, 48); // 3 mahasiswa terakhir di list
    for (const mhs of mhsAlfa) {
      for (const keg of keg3Terakhir) {
        // Cek apakah sudah ada record
        const existing = await prisma.kehadiran.findFirst({
          where: { id_mahasiswa: mhs.id_mahasiswa, id_kegiatan: keg.id_kegiatan }
        });
        if (existing) {
          await prisma.kehadiran.update({
            where: { id_kehadiran: existing.id_kehadiran },
            data: { status_kehadiran: 'ALPHA' }
          });
        } else {
          await prisma.kehadiran.create({
            data: {
              id_mahasiswa:     mhs.id_mahasiswa,
              id_kegiatan:      keg.id_kegiatan,
              status_kehadiran: 'ALPHA',
              waktu_absen:      keg.tanggal_kegiatan,
            }
          });
        }
      }
      console.log(`  ⚠️  Mahasiswa ${mhs.nama} ditandai ALPHA 3x berturut (untuk "Perlu Perhatian")`);
    }
  }

  // ── Ringkasan ──────────────────────────────────────────────────────────────
  console.log('\n============================================================');
  console.log('📊  HASIL SEED DUMMY DASHBOARD');
  console.log('============================================================');
  console.log(`  Gedung target   : ${gedungF.nama_gedung} (${gedungF.kode_gedung})`);
  console.log(`  Fasilitator     : ${fasil.nama} (${fasil.email})`);
  console.log(`  Kegiatan dibuat : ${kegiatanDibuat.length} (10 SELESAI, 2 akan datang)`);
  console.log(`  Record kehadiran: ${totalKehadiran}`);
  console.log(`  Perizinan dibuat: ${totalIzin} (3 MENUNGGU, 2 DISETUJUI, 1 DITOLAK)`);
  console.log(`  "Perlu Perhatian": 3 mahasiswa alfa 3x berturut`);
  console.log('============================================================');
  console.log('\n🎉 Seed dummy dashboard selesai!');
  console.log('\n👇 Login sebagai fasilitator Gedung F untuk melihat hasilnya:');
  console.log(`   Email   : ${fasil.email}`);
  console.log('   Password: password123\n');
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
