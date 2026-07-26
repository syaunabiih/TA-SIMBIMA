const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDummyKehadiran() {
  console.log('🌱 Memulai generate dummy data kegiatan & kehadiran...');

  try {
    // 1. Pastikan Master Jenis Kegiatan tersedia
    const jenisWajibList = [
      { nama_jenis: 'Shalat Subuh Berjamaah', is_wajib: true },
      { nama_jenis: 'Maghrib Mengaji & Tahsin', is_wajib: true },
      { nama_jenis: 'Apel Malam Minggu', is_wajib: true },
    ];

    const jenisMandiriList = [
      { nama_jenis: 'Kajian Tematik Mingguan', is_wajib: false },
      { nama_jenis: 'Gotong Royong Asrama', is_wajib: false },
    ];

    const allJenis = [...jenisWajibList, ...jenisMandiriList];
    const jenisMap = {};

    for (const j of allJenis) {
      const exist = await prisma.jenisKegiatan.findUnique({
        where: { nama_jenis: j.nama_jenis }
      });
      if (exist) {
        jenisMap[j.nama_jenis] = exist;
      } else {
        const created = await prisma.jenisKegiatan.create({
          data: { nama_jenis: j.nama_jenis, is_wajib: j.is_wajib }
        });
        jenisMap[j.nama_jenis] = created;
        console.log(`✅ Jenis kegiatan dibuat: ${j.nama_jenis} (${j.is_wajib ? 'Wajib' : 'Mandiri'})`);
      }
    }

    // 2. Ambil semua Gedung Aktif
    const gedungs = await prisma.gedung.findMany({
      where: { status_gedung: 'AKTIF' }
    });

    if (gedungs.length === 0) {
      console.log('⚠️ Tidak ada gedung berstatus AKTIF di database. Silakan tambah gedung terlebih dahulu.');
      return;
    }

    console.log(`🏢 Ditemukan ${gedungs.length} gedung aktif. Memproses 14 hari terakhir...`);

    const now = new Date();
    let totalKegiatanDibuat = 0;
    let totalKehadiranDibuat = 0;

    // 3. Loop untuk 14 hari terakhir (dari 13 hari lalu sampai hari ini)
    for (let i = 13; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);

      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');

      // Pilih kegiatan wajib secara bergantian per hari
      const namaKegiatanWajib = (i % 2 === 0) ? 'Shalat Subuh Berjamaah' : 'Maghrib Mengaji & Tahsin';
      const jenisWajib = jenisMap[namaKegiatanWajib];
      const waktuMulaiWajib = (i % 2 === 0) ? '05:00' : '18:30';
      const waktuSelesaiWajib = (i % 2 === 0) ? '05:45' : '19:30';

      for (const g of gedungs) {
        // Ambil fasilitator di gedung ini
        const fasil = await prisma.fasilitator.findFirst({
          where: { id_gedung: g.id_gedung }
        });
        if (!fasil) {
          console.log(`⚠️ Gedung ${g.nama_gedung} tidak punya fasilitator. Dilewati.`);
          continue;
        }

        // Ambil mahasiswa aktif di gedung ini
        const mahasiswas = await prisma.mahasiswa.findMany({
          where: { id_gedung: g.id_gedung, status_hunian: 'AKTIF' }
        });
        if (mahasiswas.length === 0) {
          console.log(`⚠️ Gedung ${g.nama_gedung} tidak punya mahasiswa aktif. Dilewati.`);
          continue;
        }

        // Cek apakah kegiatan wajib di hari ini untuk gedung ini sudah ada
        let kegiatanWajib = await prisma.kegiatanPembinaan.findFirst({
          where: {
            id_gedung: g.id_gedung,
            tanggal_kegiatan: targetDate,
            id_jenis_kegiatan: jenisWajib.id_jenis_kegiatan
          }
        });

        if (!kegiatanWajib) {
          kegiatanWajib = await prisma.kegiatanPembinaan.create({
            data: {
              nama_kegiatan: `${namaKegiatanWajib} - ${g.nama_gedung}`,
              deskripsi: `Presensi rutin ${namaKegiatanWajib.toLowerCase()} di lingkungan ${g.nama_gedung}.`,
              tanggal_kegiatan: targetDate,
              waktu_mulai: new Date(`1970-01-01T${waktuMulaiWajib}:00+07:00`),
              waktu_selesai: new Date(`1970-01-01T${waktuSelesaiWajib}:00+07:00`),
              lokasi: `Musholla ${g.nama_gedung}`,
              status_kegiatan: 'SELESAI',
              id_gedung: g.id_gedung,
              id_fasilitator: fasil.id_fasilitator,
              id_jenis_kegiatan: jenisWajib.id_jenis_kegiatan,
            }
          });
          totalKegiatanDibuat++;

          // Generate kehadiran mahasiswa dengan persentase realistis
          const kehadiranData = mahasiswas.map((m, idx) => {
            // Simulasi probabilitas: ~80% Hadir, ~10% Izin, ~5% Sakit, ~5% Alpha
            const rand = Math.random();
            let status = 'HADIR';
            let ket = null;

            if (rand > 0.95) {
              status = 'ALPHA';
              ket = 'Tanpa keterangan';
            } else if (rand > 0.90) {
              status = 'SAKIT';
              ket = 'Istirahat di kamar / demam';
            } else if (rand > 0.80) {
              status = 'IZIN';
              ket = 'Izin kegiatan akademik / organisasi';
            }

            const waktuAbsen = new Date(targetDate);
            waktuAbsen.setHours((i % 2 === 0) ? 5 : 18, 5 + (idx % 20), 0);

            return {
              id_kegiatan: kegiatanWajib.id_kegiatan,
              id_mahasiswa: m.id_mahasiswa,
              status_kehadiran: status,
              waktu_absen: waktuAbsen,
              keterangan: ket
            };
          });

          await prisma.kehadiran.createMany({
            data: kehadiranData
          });
          totalKehadiranDibuat += kehadiranData.length;
        }

        // Setiap 4 hari sekali, tambahkan juga 1 Kegiatan Mandiri/Optional
        if (i % 4 === 1) {
          const jenisMandiri = jenisMap['Gotong Royong Asrama'];
          let kegiatanMandiri = await prisma.kegiatanPembinaan.findFirst({
            where: {
              id_gedung: g.id_gedung,
              tanggal_kegiatan: targetDate,
              id_jenis_kegiatan: jenisMandiri.id_jenis_kegiatan
            }
          });

          if (!kegiatanMandiri) {
            kegiatanMandiri = await prisma.kegiatanPembinaan.create({
              data: {
                nama_kegiatan: `Gotong Royong Asrama - ${g.nama_gedung}`,
                deskripsi: `Kegiatan kebersihan lingkungan asrama akhir pekan.`,
                tanggal_kegiatan: targetDate,
                waktu_mulai: new Date(`1970-01-01T07:30:00+07:00`),
                waktu_selesai: new Date(`1970-01-01T09:00:00+07:00`),
                lokasi: `Halaman Depan ${g.nama_gedung}`,
                status_kegiatan: 'SELESAI',
                id_gedung: g.id_gedung,
                id_fasilitator: fasil.id_fasilitator,
                id_jenis_kegiatan: jenisMandiri.id_jenis_kegiatan,
              }
            });
            totalKegiatanDibuat++;

            // Kehadiran untuk kegiatan mandiri (~85% Hadir)
            const kehadiranMandiri = mahasiswas.map((m, idx) => {
              const rand = Math.random();
              const status = (rand > 0.85) ? 'ALPHA' : 'HADIR';
              const ket = (status === 'ALPHA') ? 'Tidak mengikuti gotong royong' : null;
              
              const waktuAbsen = new Date(targetDate);
              waktuAbsen.setHours(7, 30 + (idx % 15), 0);

              return {
                id_kegiatan: kegiatanMandiri.id_kegiatan,
                id_mahasiswa: m.id_mahasiswa,
                status_kehadiran: status,
                waktu_absen: waktuAbsen,
                keterangan: ket
              };
            });

            await prisma.kehadiran.createMany({
              data: kehadiranMandiri
            });
            totalKehadiranDibuat += kehadiranMandiri.length;
          }
        }
      }
    }

    console.log('\n🎉 Selesai generate dummy data!');
    console.log(`📊 Ringkasan:`);
    console.log(`   - Total Kegiatan Dibuat: ${totalKegiatanDibuat}`);
    console.log(`   - Total Absensi/Kehadiran Dibuat: ${totalKehadiranDibuat}`);

  } catch (err) {
    console.error('❌ Terjadi kesalahan saat seed dummy data:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedDummyKehadiran();
