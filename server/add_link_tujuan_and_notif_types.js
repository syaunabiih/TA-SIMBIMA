// Script: add_link_tujuan_and_notif_types.js
// Jalankan sekali: node server/add_link_tujuan_and_notif_types.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('📦 Menambahkan kolom link_tujuan ke tabel notifikasi...');

  // 1. Tambah kolom link_tujuan (nullable)
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE notifikasi 
      ADD COLUMN IF NOT EXISTS link_tujuan VARCHAR(255) NULL
    `);
    console.log('✅ Kolom link_tujuan berhasil ditambahkan (atau sudah ada).');
  } catch (e) {
    console.log('ℹ️  Kolom link_tujuan mungkin sudah ada:', e.message);
  }

  // 2. Tambah nilai enum baru ke tipe_notifikasi
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE notifikasi 
      MODIFY COLUMN tipe_notifikasi ENUM('INFO','PERINGATAN','PENGUMUMAN','IZIN','FOTO_BERANGKAT','FOTO_PULANG') NOT NULL
    `);
    console.log('✅ Enum tipe_notifikasi berhasil diperbarui dengan FOTO_BERANGKAT dan FOTO_PULANG.');
  } catch (e) {
    console.error('❌ Gagal update enum:', e.message);
  }

  console.log('\n🎉 Selesai! Restart server backend setelah ini.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
