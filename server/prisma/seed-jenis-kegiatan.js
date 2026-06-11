const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Jenis Kegiatan...');
  const data = [
    { nama_jenis: 'Shalat Subuh Berjamaah', is_wajib: true },
    { nama_jenis: 'Absen Malam', is_wajib: true },
    { nama_jenis: 'Kajian Rutin', is_wajib: false },
    { nama_jenis: 'Lainnya', is_wajib: false },
  ];

  for (const d of data) {
    await prisma.jenisKegiatan.upsert({
      where: { nama_jenis: d.nama_jenis },
      update: {},
      create: d,
    });
  }
  console.log('Seed Jenis Kegiatan selesai.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
