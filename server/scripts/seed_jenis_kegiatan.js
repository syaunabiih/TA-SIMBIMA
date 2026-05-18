const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const defaults = [
  { nama: 'Shalat Subuh Berjamaah', kode: 'SHALAT_SUBUH', deskripsi: 'Kegiatan shalat subuh berjamaah di musholla asrama' },
  { nama: 'Absensi Malam', kode: 'ABSENSI_MALAM', deskripsi: 'Pengecekan kehadiran mahasiswa di malam hari' },
  { nama: 'Kegiatan Pembinaan', kode: 'KEGIATAN_PEMBINAAN', deskripsi: 'Kegiatan pembinaan karakter mahasiswa' },
  { nama: 'Kegiatan Kebersamaan', kode: 'KEGIATAN_KEBERSAMAAN', deskripsi: 'Kegiatan kebersamaan seluruh penghuni asrama' },
  { nama: 'Kegiatan AMA', kode: 'KEGIATAN_AMA', deskripsi: 'Kegiatan Asrama Mahasiswa Andalas' },
];
async function run() {
  for (const d of defaults) {
    await p.jenisKegiatanMaster.upsert({
      where: { kode: d.kode },
      update: {},
      create: { ...d, is_aktif: true }
    });
    console.log('Seeded:', d.kode);
  }
  await p.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
