const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS PushSubscription (
      id INT AUTO_INCREMENT PRIMARY KEY,
      endpoint TEXT NOT NULL,
      keys_p256dh TEXT NOT NULL,
      keys_auth TEXT NOT NULL,
      id_mahasiswa INT NULL,
      id_fasilitator INT NULL,
      id_ketua_pokja INT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      FOREIGN KEY (id_mahasiswa) REFERENCES mahasiswa(id_mahasiswa) ON DELETE CASCADE,
      FOREIGN KEY (id_fasilitator) REFERENCES fasilitator(id_fasilitator) ON DELETE CASCADE,
      FOREIGN KEY (id_ketua_pokja) REFERENCES ketua_pokja(id_ketua_pokja) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('PushSubscription table created successfully via SQL!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
