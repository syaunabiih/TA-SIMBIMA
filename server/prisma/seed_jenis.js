const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedJenis() {
  const items = [
    { nama: 'Shalat Subuh Berjamaah', isWajib: true,  isAktif: true },
    { nama: 'Absen Malam',            isWajib: true,  isAktif: true },
    { nama: 'Kegiatan Pembinaan',     isWajib: false, isAktif: true },
    { nama: 'Kegiatan Kebersamaan',   isWajib: false, isAktif: true },
    { nama: 'Kegiatan AMA',           isWajib: false, isAktif: true },
  ];
  for (const item of items) {
    await prisma.jenisKegiatan.upsert({
      where: { nama: item.nama },
      update: {},
      create: item,
    });
    console.log('Seeded:', item.nama);
  }
  console.log('Done!');
  await prisma.$disconnect();
}
seedJenis().catch(e => { console.error(e); process.exit(1); });
