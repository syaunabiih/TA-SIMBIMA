const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai proses seeding data dummy SIMBIMA...');

  // 1. Hash password default untuk semua user (misal: "123456")
  const hashedPassword = await bcrypt.hash('123456', 10);

  // 2. Buat Data Gedung Utama
  const gedungA = await prisma.gedung.upsert({
    where: { kode_gedung: 'A01' },
    update: {}, // Jika sudah ada, jangan lakukan apa-apa
    create: {
      nama_gedung: 'Asrama Putra Gedung A',
      kode_gedung: 'A01',
      alamat: 'Lingkungan Kampus Unand Limau Manis',
      jumlah_lantai: 4,
      kapasitas_mahasiswa: 200,
      status_gedung: 'AKTIF',
    },
  });
  console.log('✅ Data Gedung berhasil dibuat');

  // 3. Buat Data Ketua Pokja
  const pokja = await prisma.ketuaPokja.upsert({
    where: { nip: '198001012005011001' },
    update: {},
    create: {
      nip: '198001012005011001',
      nama: 'Bapak Ketua Pokja',
      email: 'pokja@unand.ac.id',
      password: hashedPassword,
      no_telp: '081234567890',
    },
  });
  console.log('✅ Data Ketua Pokja berhasil dibuat');

  // 4. Buat Data Fasilitator
  const fasilitator = await prisma.fasilitator.upsert({
    where: { nip: '199002022010021002' },
    update: {},
    create: {
      nip: '199002022010021002',
      nama: 'Uda Fasilitator',
      email: 'fasilitator@unand.ac.id',
      password: hashedPassword,
      no_telp: '081298765432',
      id_gedung: gedungA.id_gedung,
    },
  });
  console.log('✅ Data Fasilitator berhasil dibuat');

  // 5. Buat Data Mahasiswa
  const mahasiswa1 = await prisma.mahasiswa.upsert({
    where: { nim: '2211523012' },
    update: {},
    create: {
      nim: '2211523012',
      nama: 'Syauqi Nabiih Marwa',
      email: 'syauqi@student.unand.ac.id',
      password: hashedPassword,
      lantai: 2,
      nomor_kamar: 'A-205',
      alamat_asal: 'Padang',
      no_telp: '082211223344',
      id_gedung: gedungA.id_gedung,
      status_hunian: 'AKTIF', 
    },
  });

  const mahasiswa2 = await prisma.mahasiswa.upsert({
    where: { nim: '2211523000' },
    update: {},
    create: {
      nim: '2211523000',
      nama: 'Mahasiswa Non-Aktif (Testing)',
      email: 'nonaktif@student.unand.ac.id',
      password: hashedPassword,
      lantai: 1,
      nomor_kamar: 'A-101',
      alamat_asal: 'Bukittinggi',
      no_telp: '085566778899',
      id_gedung: gedungA.id_gedung,
      status_hunian: 'KELUAR', // Sengaja dibikin keluar untuk ngetes ditolak login
    },
  });
  console.log('✅ Data Mahasiswa berhasil dibuat');

  console.log('Proses seeding selesai! 🎉');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });