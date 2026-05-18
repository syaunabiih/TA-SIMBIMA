/**
 * Script: add_qr_fields.js
 * Menambahkan kolom qr_token dan qr_expires_at ke tabel kegiatan_pembinaan
 * Jalankan: node scripts/add_qr_fields.js
 */
process.env.TZ = 'Asia/Jakarta';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('▶ Mengecek dan menambahkan kolom QR ke tabel kegiatan_pembinaan...');

  // Cek apakah kolom sudah ada
  const cols = await prisma.$queryRaw`
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'kegiatan_pembinaan'
      AND COLUMN_NAME IN ('qr_token', 'qr_expires_at')
  `;

  const existingCols = cols.map(c => c.COLUMN_NAME);
  console.log('Kolom yang sudah ada:', existingCols);

  if (!existingCols.includes('qr_token')) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE kegiatan_pembinaan ADD COLUMN qr_token VARCHAR(191) NULL UNIQUE`
    );
    console.log('✅ Kolom qr_token berhasil ditambahkan.');
  } else {
    console.log('ℹ️  Kolom qr_token sudah ada, dilewati.');
  }

  if (!existingCols.includes('qr_expires_at')) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE kegiatan_pembinaan ADD COLUMN qr_expires_at DATETIME(3) NULL`
    );
    console.log('✅ Kolom qr_expires_at berhasil ditambahkan.');
  } else {
    console.log('ℹ️  Kolom qr_expires_at sudah ada, dilewati.');
  }

  console.log('\n✅ Selesai! Sekarang jalankan: npx prisma generate');
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
