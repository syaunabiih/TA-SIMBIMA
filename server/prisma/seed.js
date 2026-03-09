// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Mulai seeding database...');

  // 1. Buat Data GEDUNG
  const gedungA = await prisma.gedung.upsert({
    where: { kode_gedung: 'G_A' },
    update: {},
    create: {
      nama_gedung: 'Asrama Putra A',
      kode_gedung: 'G_A',
      alamat: 'Jl. Limau Manis',
      jumlah_lantai: 3,
      kapasitas_mahasiswa: 100,
      status_gedung: 'AKTIF',
    },
  });

  const gedungB = await prisma.gedung.upsert({
    where: { kode_gedung: 'G_B' },
    update: {},
    create: {
      nama_gedung: 'Asrama Putri B',
      kode_gedung: 'G_B',
      alamat: 'Jl. Limau Manis',
      jumlah_lantai: 3,
      kapasitas_mahasiswa: 100,
      status_gedung: 'AKTIF',
    },
  });

  console.log('✅ Gedung berhasil dibuat');

  // Password Hash (Semua akun passwordnya: 123456)
  const passwordHash = await bcrypt.hash('123456', 10);

  // 2. Buat Data FASILITATOR
  await prisma.fasilitator.upsert({
    where: { nip: '19900101' },
    update: {},
    create: {
      nip: '19900101',
      nama: 'Budi Fasilitator A',
      email: 'fasil_a@simbima.com',
      password: passwordHash,
      id_gedung: gedungA.id_gedung,
    },
  });

  await prisma.fasilitator.upsert({
    where: { nip: '19900202' },
    update: {},
    create: {
      nip: '19900202',
      nama: 'Siti Fasilitator B',
      email: 'fasil_b@simbima.com',
      password: passwordHash,
      id_gedung: gedungB.id_gedung,
    },
  });

  console.log('✅ Fasilitator berhasil dibuat');

  // 3. Buat Data MAHASISWA
  await prisma.mahasiswa.upsert({
    where: { nim: '2211521001' },
    update: {},
    create: {
      nim: '2211521001',
      nama: 'Andi Mahasiswa A',
      email: 'andi@mhs.unand.ac.id',
      password: passwordHash,
      id_gedung: gedungA.id_gedung,
      lantai: 1,
      nomor_kamar: '101',
      kuota_izin_pulang: 10,
    },
  });

  await prisma.mahasiswa.upsert({
    where: { nim: '2211521002' },
    update: {},
    create: {
      nim: '2211521002',
      nama: 'Rina Mahasiswa B',
      email: 'rina@mhs.unand.ac.id',
      password: passwordHash,
      id_gedung: gedungB.id_gedung,
      lantai: 2,
      nomor_kamar: '205',
      kuota_izin_pulang: 10,
    },
  });

  console.log('✅ Mahasiswa berhasil dibuat');
  console.log('🚀 Seeding selesai! Database siap digunakan.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });