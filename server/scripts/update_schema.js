const fs = require('fs');
let schema = fs.readFileSync('d:/Vs code/TA (simbima)/server/prisma/schema.prisma', 'utf8');

schema = schema.replace('notifikasis       Notifikasi[]', 'notifikasis       Notifikasi[]\n  push_subscriptions PushSubscription[]');
schema = schema.replace('kegiatans      KegiatanPembinaan[]', 'kegiatans      KegiatanPembinaan[]\n  push_subscriptions PushSubscription[]');
schema = schema.replace('evaluasis       EvaluasiPembinaan[]', 'evaluasis       EvaluasiPembinaan[]\n  push_subscriptions PushSubscription[]');

const modelStr = `
model PushSubscription {
  id              Int          @id @default(autoincrement())
  endpoint        String       @db.Text
  keys_p256dh     String       @db.Text
  keys_auth       String       @db.Text
  id_mahasiswa    Int?
  id_fasilitator  Int?
  id_ketua_pokja  Int?
  created_at      DateTime     @default(now())

  mahasiswa       Mahasiswa?   @relation(fields: [id_mahasiswa], references: [id_mahasiswa], onDelete: Cascade)
  fasilitator     Fasilitator? @relation(fields: [id_fasilitator], references: [id_fasilitator], onDelete: Cascade)
  ketua_pokja     KetuaPokja?  @relation(fields: [id_ketua_pokja], references: [id_ketua_pokja], onDelete: Cascade)
}
`;

fs.writeFileSync('d:/Vs code/TA (simbima)/server/prisma/schema.prisma', schema + modelStr);
console.log('Schema updated!');
