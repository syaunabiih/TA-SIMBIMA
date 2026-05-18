// Script: tambah kolom foto ke tabel perizinan (tanpa migrate, aman untuk data)
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Gunakan $executeRawUnsafe untuk DDL langsung
  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE `perizinan` ADD COLUMN IF NOT EXISTS `foto_berangkat` VARCHAR(191) NULL"
    );
    console.log('✅ Kolom foto_berangkat berhasil ditambahkan (atau sudah ada)');
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('ℹ️  Kolom foto_berangkat sudah ada, skip.');
    } else {
      throw e;
    }
  }
  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE `perizinan` ADD COLUMN IF NOT EXISTS `foto_pulang` VARCHAR(191) NULL"
    );
    console.log('✅ Kolom foto_pulang berhasil ditambahkan (atau sudah ada)');
  } catch (e) {
    if (e.message.includes('Duplicate column')) {
      console.log('ℹ️  Kolom foto_pulang sudah ada, skip.');
    } else {
      throw e;
    }
  }
}

main()
  .then(() => {
    console.log('🎉 Selesai! Kolom foto berhasil ditambahkan ke tabel perizinan.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
