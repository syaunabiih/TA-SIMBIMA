const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    // 1. Cari atau buat "2026/2027"
    let ta = await prisma.tahunAkademik.findUnique({ where: { nama: '2026/2027' } });
    if (!ta) {
      ta = await prisma.tahunAkademik.create({ data: { nama: '2026/2027', is_aktif: true } });
    } else {
      ta = await prisma.tahunAkademik.update({ where: { id_tahun: ta.id_tahun }, data: { is_aktif: true } });
    }

    // Nonaktifkan yang lain
    await prisma.tahunAkademik.updateMany({
      where: { id_tahun: { not: ta.id_tahun } },
      data: { is_aktif: false }
    });

    // 2. Set mahasiswa ke TA aktif
    const result = await prisma.mahasiswa.updateMany({
      data: { id_tahun_akademik: ta.id_tahun }
    });

    console.log(`Success! Updated ${result.count} mahasiswa to Tahun Akademik: ${ta.nama}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
