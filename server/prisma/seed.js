const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding database SIMBIMA...\n');

  // Bersihkan data lama
  try {
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name != '_prisma_migrations'`;
    for (const row of tables) {
      const t = row.table_name || row.TABLE_NAME;
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${t}\`;`);
    }
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('🧹 Data lama dibersihkan\n');
  } catch(e) {
    console.log('⚠️  Gagal truncate, lanjut seeding...', e.message, '\n');
  }

  const hash = await bcrypt.hash('password123', 10);
  const hashAdmin = await bcrypt.hash('admin123', 10);

  // ============================================================
  // 1. KETUA POKJA / SUPERADMIN
  // ============================================================
  // ⭐ Akun SUPERADMIN default — login pakai: username=ketuapokja, password=admin123
  await prisma.ketuaPokja.create({
    data: {
      nip:      'ketuapokja',
      nama:     'Ketua Pokja',
      email:    'ketuapokja@simbima.com',
      password: hashAdmin,
      no_telp:  '081234567890',
    }
  });
  
  await prisma.ketuaPokja.create({
    data: {
      nip:      'POKJA001',
      nama:     'Dr. Rahmat Hidayat',
      email:    'ketua.pokja@simbima.com',
      password: hash,
      no_telp:  '081234567890',
    }
  });
  console.log('✅ Ketua Pokja & Superadmin selesai (2 akun)');

  // ============================================================
  // 2. GEDUNG (7 gedung)
  // ============================================================
  const gedungData = [
    { kode: 'A', nama: 'Asrama RPX',          lantai: 5, kapasitas: 360 },
    { kode: 'B', nama: 'Asrama Rusunawa',      lantai: 5, kapasitas: 360 },
    { kode: 'C', nama: 'Asrama Pupera Putri',  lantai: 5, kapasitas: 360 },
    { kode: 'D', nama: 'Asrama Menpera',       lantai: 5, kapasitas: 360 },
    { kode: 'E', nama: 'Asrama RMS',           lantai: 5, kapasitas: 360 },
    { kode: 'F', nama: 'Asrama Oren',          lantai: 5, kapasitas: 360 },
    { kode: 'G', nama: 'Asrama Hijau',         lantai: 5, kapasitas: 360 },
  ];

  const gedungMap = {};
  for (const g of gedungData) {
    const rec = await prisma.gedung.create({
      data: {
        kode_gedung:          g.kode,
        nama_gedung:          g.nama,
        alamat:               `Kompleks Asrama Universitas Andalas, Gedung ${g.nama}`,
        jumlah_lantai:        g.lantai,
        kapasitas_mahasiswa:  g.kapasitas,
      }
    });
    gedungMap[g.kode] = rec.id_gedung;
  }
  console.log('✅ Gedung selesai (7 gedung)');

  // ============================================================
  // 3. FASILITATOR (14 akun, 2 per gedung)
  // ============================================================
  const fasilitatorData = [
    { nip:'FASIL-A1', nama:'Uni Pera Anggraini',  email:'pera@simbima.com',  gedung:'A' },
    { nip:'FASIL-A2', nama:'Uni Hanim Salsabila', email:'hanim@simbima.com', gedung:'A' },
    { nip:'FASIL-B1', nama:'Uni Winti Rahayu',    email:'winti@simbima.com',    gedung:'B' },
    { nip:'FASIL-B2', nama:'Uni Sharila Putri',   email:'sharila@simbima.com',   gedung:'B' },
    { nip:'FASIL-C1', nama:'Uni Nisak Fadhilah',  email:'nisak@simbima.com',  gedung:'C' },
    { nip:'FASIL-C2', nama:'Uni Ria Permata',     email:'ria@simbima.com',     gedung:'C' },
    { nip:'FASIL-D1', nama:'Uni Rizka Amelia',    email:'rizka@simbima.com',    gedung:'D' },
    { nip:'FASIL-D2', nama:'Uni Putri Maharani',  email:'putri@simbima.com',  gedung:'D' },
    { nip:'FASIL-E1', nama:'Uni Dini Lestari',    email:'dini@simbima.com',    gedung:'E' },
    { nip:'FASIL-E2', nama:'Uni Respi Oktavia',   email:'respi@simbima.com',   gedung:'E' },
    { nip:'FASIL-F1', nama:'Uda Syauqi Marwa',    email:'syauqi@simbima.com',    gedung:'F' },
    { nip:'FASIL-F2', nama:'Uda Andes Pratama',   email:'andes@simbima.com',   gedung:'F' },
    { nip:'FASIL-G1', nama:'Uda Jeky Fernanda',   email:'jeky@simbima.com',   gedung:'G' },
    { nip:'FASIL-G2', nama:'Uda Rendi Saputra',   email:'rendi@simbima.com',   gedung:'G' },
  ];

  const fasilMap = {};
  for (const f of fasilitatorData) {
    const rec = await prisma.fasilitator.create({
      data: {
        nip:       f.nip,
        nama:      f.nama,
        email:     f.email,
        password:  hash,
        no_telp:   '08' + String(Math.floor(Math.random() * 9000000000) + 1000000000).slice(0,10),
        id_gedung: gedungMap[f.gedung],
      }
    });
    fasilMap[f.gedung] = fasilMap[f.gedung] || [];
    fasilMap[f.gedung].push(rec.id_fasilitator);
  }
  console.log('✅ Fasilitator selesai (14 akun)');

  // ============================================================
  // 4. MAHASISWA (2520 mahasiswa)
  // ============================================================
  const namaDepanW = [
    'Ayu','Bunga','Citra','Dewi','Eka','Fitri','Gita','Hani','Indah','Jasmine',
    'Kania','Lina','Maya','Nita','Olivia','Putri','Rani','Sari','Tari','Ulfa',
    'Vina','Wulan','Yuni','Zahra','Annisa','Bella','Cantika','Dinda','Elsa','Fira',
    'Gloria','Hesti','Ika','Julia','Kartika','Laila','Mega','Nadia','Prita','Rara',
    'Siska','Tika','Umi','Vera','Widya','Yola','Amelia','Bintang','Clara','Dara',
    'Erni','Feby','Ghina','Hasna','Irma','Jihan','Kinanti','Lidya','Mira','Nabila',
    'Pipit','Rahma','Salma','Tiara','Ulya','Vira','Winda','Yumna','Zara','Adinda',
    'Bela','Cindy','Dian','Elita','Fani','Gina','Hana','Ines','Jeni','Khansa'
  ];
  const namaDepanP = [
    'Ahmad','Budi','Rizky','Fajar','Hendra','Irfan','Joko','Kevin','Lukman','Maulana',
    'Nanda','Oscar','Pandu','Rafi','Satria','Taufik','Umar','Wahyu','Yoga','Zaki',
    'Aldi','Bagas','Candra','Dimas','Eko','Farel','Gilang','Hadi','Ivan','Joni',
    'Luthfi','Mirza','Nabil','Prima','Radit','Sigit','Teguh','Vino','Wandi','Yusuf',
    'Zainal','Arif','Bayu','Denis','Erlangga','Ferry','Guntur','Hafiz','Ilham','Jefri',
    'Karim','Latif','Mahesa','Naufal','Reza','Surya','Tri','Wildan','Yogi','Andri',
    'Bram','Dani','Edo','Fandi','Ganda','Hamid','Ismail','Ridho','Sandi','Tomy',
    'Ucok','Agung','Beni','Cahyo','Danu','Fuad','Galih','Haris','Ikhsan','Joko'
  ];
  const namaBelakang = [
    'Pratama','Wijaya','Santoso','Kusuma','Permata','Saputra','Hidayat','Nugroho',
    'Purnama','Ramadan','Setiawan','Utama','Wicaksono','Adiputra','Budiman','Cahyono',
    'Dermawan','Efendi','Firmansyah','Gunawan','Hartono','Iskandar','Junaidi','Kurniawan',
    'Lestari','Mahendra','Nasution','Oktavian','Prasetyo','Rahayu','Suryana','Tampubolon',
    'Wahyudi','Yanuar','Zulkarnain','Anwar','Basuki','Chandra','Darwis','Fuadi',
    'Hakim','Iswanto','Krisnanda','Lubis','Mardian','Nainggolan','Panjaitan','Rachman',
    'Simanjuntak','Tanjung','Utami','Winarno','Yusrina','Akbar','Bahri','Darmawan',
    'Fauzan','Harahap','Ibrahim','Jatmiko','Kartono','Lazuardi','Mulyadi','Nurdiana'
  ];

  // A,B,C,D = putri | E,F,G = putra
  const gedungGender = { A:'W', B:'W', C:'W', D:'W', E:'P', F:'P', G:'P' };
  function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  let nimCounter = 10001;
  let totalMhs   = 0;
  const BATCH    = 200;
  let batchData  = [];

  for (const kode of ['A','B','C','D','E','F','G']) {
    const isWanita = gedungGender[kode] === 'W';
    for (let lantai = 1; lantai <= 5; lantai++) {
      for (const blok of ['A','B']) {
        for (let kamar = 1; kamar <= 2; kamar++) {
          for (let orang = 1; orang <= 1; orang++) {
            const dep = isWanita ? rnd(namaDepanW) : rnd(namaDepanP);
            const bel = rnd(namaBelakang);
            const nim = `23${kode}${String(nimCounter).padStart(5,'0')}`;
            nimCounter++;
            totalMhs++;

            batchData.push({
              nim,
              nama:            `${dep} ${bel}`,
              email:           `${nim.toLowerCase()}@student.unand.ac.id`,
              password:         hash,
              lantai,
              nomor_kamar:     `${blok}${String(kamar).padStart(2,'0')}`,
              no_telp:         '08' + String(Math.floor(Math.random() * 9000000000) + 1000000000).slice(0,10),
              kuota_izin_pulang: 10,
              id_gedung:       gedungMap[kode],
            });

            if (batchData.length >= BATCH) {
              await prisma.mahasiswa.createMany({ data: batchData, skipDuplicates: true });
              batchData = [];
              process.stdout.write(`\r  Mahasiswa: ${totalMhs}/140`);
            }
          }
        }
      }
    }
  }
  if (batchData.length > 0) {
    await prisma.mahasiswa.createMany({ data: batchData, skipDuplicates: true });
  }
  console.log(`\n✅ Mahasiswa selesai (${totalMhs} mahasiswa)`);

  // ============================================================
  // 5. KEGIATAN SAMPEL & PETUGAS (3 Kegiatan Gedung F)
  // ============================================================
  const now = new Date();
  const thn = now.getFullYear();
  const bln = now.getMonth();
  const fasilF1 = fasilMap['F'][0];

  // Ambil beberapa mahasiswa Gedung F untuk dijadikan petugas
  const mhsF = await prisma.mahasiswa.findMany({
    where: { id_gedung: gedungMap['F'] },
    take: 5
  });

  const kegiatanSampel = [
    { nama:'Shalat Subuh Berjamaah',     jenis:'SHALAT_SUBUH',         tgl: new Date(thn,bln, 5), mulai:'05:00', selesai:'06:00', lokasi:'Musholla Asrama Oren', status:'SELESAI' },
    { nama:'Absensi Malam',              jenis:'ABSENSI_MALAM',        tgl: new Date(thn,bln, 8), mulai:'21:00', selesai:'21:30', lokasi:'Koridor Gedung Oren', status:'BERLANGSUNG' },
    { nama:'Kegiatan Pembinaan Karakter',jenis:'KEGIATAN_PEMBINAAN',   tgl: new Date(thn,bln,12), mulai:'19:30', selesai:'21:00', lokasi:'Aula Asrama Oren', status:'BERLANGSUNG' },
  ];

  for (const k of kegiatanSampel) {
    const [jm, jt] = k.mulai.split(':').map(Number);
    const [sm, st] = k.selesai.split(':').map(Number);
    
    console.log("Mencoba membuat kegiatan:", k);

    // Buat kegiatan
    const kegiatanBaru = await prisma.kegiatanPembinaan.create({
      data: {
        nama_kegiatan:    k.nama,
        jenis_kegiatan:   k.jenis,
        tanggal_kegiatan: k.tgl,
        waktu_mulai:      new Date(1970, 0, 1, jm, jt, 0),
        waktu_selesai:    new Date(1970, 0, 1, sm, st, 0),
        lokasi:           k.lokasi,
        status_kegiatan:  k.status,
        id_gedung:        gedungMap['F'],
        id_fasilitator:   fasilF1,
      }
    });
    console.log("Berhasil membuat kegiatan:", kegiatanBaru.nama_kegiatan);

    // Buat petugas absensi untuk kegiatan ini
    if (mhsF.length >= 2) {
      await prisma.petugasAbsensi.createMany({
        data: [
          {
            id_kegiatan: kegiatanBaru.id_kegiatan,
            id_mahasiswa: mhsF[0].id_mahasiswa,
            lantai_tanggung_jawab: mhsF[0].lantai,
            status_tugas: k.status === 'SELESAI' ? 'SELESAI' : 'DITUGASKAN'
          },
          {
            id_kegiatan: kegiatanBaru.id_kegiatan,
            id_mahasiswa: mhsF[1].id_mahasiswa,
            lantai_tanggung_jawab: mhsF[1].lantai,
            status_tugas: k.status === 'SELESAI' ? 'SELESAI' : 'DITUGASKAN'
          }
        ]
      });
      console.log("Berhasil membuat petugas absensi untuk:", kegiatanBaru.nama_kegiatan);
    }
  }
  console.log('✅ Kegiatan & Petugas sampel selesai (3 kegiatan Asrama Oren)');

  // ============================================================
  // RINGKASAN
  // ============================================================
  console.log('\n============================================================');
  console.log('📋  AKUN LOGIN SIMBIMA');
  console.log('============================================================');
  console.log('⭐  SUPERADMIN (Ketua Pokja):');
  console.log('    Username : ketuapokja');
  console.log('    Password : admin123');
  console.log('------------------------------------------------------------');
  console.log('👑  Ketua Pokja Lama  : ketua.pokja@simbima.com  / password123');
  console.log('------------------------------------------------------------');
  const labelGedung = {
    A:'Asrama RPX', B:'Asrama Rusunawa', C:'Asrama Pupera Putri',
    D:'Asrama Menpera', E:'Asrama RMS', F:'Asrama Oren ⭐', G:'Asrama Hijau'
  };
  console.log('👩  Fasilitator (login pakai email) / password: password123:');
  for (const f of fasilitatorData) {
    console.log(`    ${f.email.padEnd(32)} → ${f.nama} (${labelGedung[f.gedung]})`);
  }
  console.log('------------------------------------------------------------');
  console.log('🎓  Mahasiswa (login pakai email):');
  console.log('    Format email  : [nim]@student.unand.ac.id');
  console.log('    Asrama Oren (F) — Lt.1 Blok A:');
  console.log('      23f10001@student.unand.ac.id  (Kamar A01 orang ke-1)');
  console.log('      23f10002@student.unand.ac.id  (Kamar A01 orang ke-2)');
  console.log('      23f10003@student.unand.ac.id  (Kamar A01 orang ke-3)');
  console.log('      23f10004@student.unand.ac.id  (Kamar A02 orang ke-1)');
  console.log('============================================================\n');
  console.log('🎉 Seeding selesai!');
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });