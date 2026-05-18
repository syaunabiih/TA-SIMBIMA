// Script untuk menambahkan akun SUPERADMIN tanpa menghapus data yang ada
// Jalankan dengan: node prisma/add-superadmin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Menambahkan akun SUPERADMIN...\n');

  // Cek apakah sudah ada
  const existing = await prisma.ketuaPokja.findUnique({
    where: { nip: 'ketuapokja' }
  });

  if (existing) {
    console.log('⚠️  Akun dengan nip "ketuapokja" sudah ada:', existing.nama);
    console.log('   Apabila ingin reset password, update secara manual.');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superadmin = await prisma.ketuaPokja.create({
    data: {
      nip:      'ketuapokja',
      nama:     'Ketua Pokja',
      email:    'ketuapokja@simbima.com',
      password: hashedPassword,
      no_telp:  '081234567890',
    }
  });

  console.log('✅ Akun SUPERADMIN berhasil dibuat!');
  console.log('============================================================');
  console.log('⭐  LOGIN SUPERADMIN:');
  console.log('    Username (NIP) : ketuapokja');
  console.log('    Password       : admin123');
  console.log('    Role JWT       : SUPERADMIN');
  console.log('    ID             :', superadmin.id_ketua_pokja);
  console.log('============================================================\n');
}

main()
  .catch(e => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
