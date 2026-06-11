const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fakultasList = [
  "Teknik", "Hukum", "Pertanian", "Kedokteran", "MIPA", 
  "Ekonomi dan Bisnis", "Peternakan", "Ilmu Budaya", "ISIP", 
  "Farmasi", "Teknologi Pertanian", "Kesehatan Masyarakat", 
  "Keperawatan", "Teknologi Informasi", "Kedokteran Gigi"
];

const jurusanList = [
  { nama: "Teknik Sipil", fakultas: "Teknik" },
  { nama: "Teknik Mesin", fakultas: "Teknik" },
  { nama: "Teknik Industri", fakultas: "Teknik" },
  { nama: "Teknik Lingkungan", fakultas: "Teknik" },
  { nama: "Teknik Elektro", fakultas: "Teknik" },
  { nama: "Arsitektur", fakultas: "Teknik" },
  { nama: "Hukum", fakultas: "Hukum" },
  { nama: "Ilmu Hukum", fakultas: "Hukum" },
  { nama: "Agribisnis", fakultas: "Pertanian" },
  { nama: "Agroteknologi", fakultas: "Pertanian" },
  { nama: "Ilmu Tanah", fakultas: "Pertanian" },
  { nama: "Proteksi Tanaman", fakultas: "Pertanian" },
  { nama: "Penyuluhan Pertanian", fakultas: "Pertanian" },
  { nama: "Sosial Ekonomi Pertanian", fakultas: "Pertanian" },
  { nama: "Kedokteran", fakultas: "Kedokteran" },
  { nama: "Kebidanan", fakultas: "Kedokteran" },
  { nama: "Kimia", fakultas: "MIPA" },
  { nama: "Fisika", fakultas: "MIPA" },
  { nama: "Biologi", fakultas: "MIPA" },
  { nama: "Matematika", fakultas: "MIPA" },
  { nama: "Ekonomi", fakultas: "Ekonomi dan Bisnis" },
  { nama: "Manajemen", fakultas: "Ekonomi dan Bisnis" },
  { nama: "Akuntansi", fakultas: "Ekonomi dan Bisnis" },
  { nama: "Vokasi", fakultas: "Ekonomi dan Bisnis" },
  { nama: "Teknologi Produksi Ternak", fakultas: "Peternakan" },
  { nama: "Ilmu Nutrisi  dan Teknologi Pakan", fakultas: "Peternakan" },
  { nama: "Teknologi Pengelolaan Hasil Ternak", fakultas: "Peternakan" },
  { nama: "Pembangunandan Bisnis Peternakan", fakultas: "Peternakan" },
  { nama: "Perternakan", fakultas: "Peternakan" },
  { nama: "Linguistik", fakultas: "Ilmu Budaya" },
  { nama: "Kajian Sejarah", fakultas: "Ilmu Budaya" },
  { nama: "Sastra dan Budaya", fakultas: "Ilmu Budaya" },
  { nama: "Sosiologi", fakultas: "ISIP" },
  { nama: "Antropologi", fakultas: "ISIP" },
  { nama: "Ilmu Politik", fakultas: "ISIP" },
  { nama: "Adminstrasi Publik", fakultas: "ISIP" },
  { nama: "Hubungan Internasional", fakultas: "ISIP" },
  { nama: "Ilmu Komunikasi", fakultas: "ISIP" },
  { nama: "Farmasi", fakultas: "Farmasi" },
  { nama: "Teknik Pertanian dan Biosistem", fakultas: "Teknologi Pertanian" },
  { nama: "Teknologi Pangan dan Hasil Pertanian", fakultas: "Teknologi Pertanian" },
  { nama: "Teknologi Industri Pertanian", fakultas: "Teknologi Pertanian" },
  { nama: "Ilmu Kesehatan Masyarakat", fakultas: "Kesehatan Masyarakat" },
  { nama: "Ilmu Gizi", fakultas: "Kesehatan Masyarakat" },
  { nama: "Ilmu Keperawatan", fakultas: "Keperawatan" },
  { nama: "Teknik Komputer", fakultas: "Teknologi Informasi" },
  { nama: "Sistem Informasi", fakultas: "Teknologi Informasi" },
  { nama: "Informatika", fakultas: "Teknologi Informasi" },
  { nama: "Kedokteran Gigi", fakultas: "Kedokteran Gigi" }
];

async function main() {
  console.log("Seeding Fakultas...");
  for (const f of fakultasList) {
    await prisma.fakultas.upsert({
      where: { nama: f },
      update: {},
      create: { nama: f }
    });
  }

  console.log("Seeding Jurusan...");
  const fakMap = {};
  const faks = await prisma.fakultas.findMany();
  for (const f of faks) fakMap[f.nama] = f.id_fakultas;

  for (const j of jurusanList) {
    const fakId = fakMap[j.fakultas];
    if (fakId) {
      // Find existing
      const existing = await prisma.jurusan.findFirst({
        where: { nama: j.nama, id_fakultas: fakId }
      });
      if (!existing) {
        await prisma.jurusan.create({
          data: { nama: j.nama, id_fakultas: fakId }
        });
      }
    }
  }
  console.log("Seeding Done!");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
