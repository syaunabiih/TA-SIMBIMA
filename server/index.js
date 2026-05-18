// index.js
process.env.TZ = 'Asia/Jakarta';
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const path = require("path");

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const authRoutes = require("./routes/authRoutes");
const kegiatanRoutes = require("./routes/kegiatanRoutes");
const izinRoutes = require("./routes/izinRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");
const mahasiswaRoutes = require("./routes/mahasiswaRoutes");
const rekapRoutes = require("./routes/rekapRoutes");
const notifikasiRoutes = require("./routes/notifikasiRoutes");
const dashboardRoutes  = require("./routes/dashboardRoutes");
const adminRoutes      = require("./routes/adminRoutes");

// Middleware
app.use(cors());
app.use(express.json()); // Agar bisa baca data JSON dari frontend
app.use("/api/auth", authRoutes);
app.use("/api/kegiatan", kegiatanRoutes); 
app.use("/api/izin", izinRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/mahasiswa", mahasiswaRoutes);
app.use("/api/rekap", rekapRoutes);
app.use("/api/notifikasi", notifikasiRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

// Folder statis untuk penyimpanan file bukti
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Test Route (Cek apakah server jalan)
app.get("/", (req, res) => {
  res.send("Halo! Server SIMBIMA sudah jalan 🚀");
});

// Test Database Connection
app.get("/api/test-db", async (req, res) => {
  try {
    // Coba ambil data gedung (pasti masih kosong, tapi gapapa)
    const gedung = await prisma.gedung.findMany();
    res.json({
      status: "Sukses",
      message: "Koneksi Database Berhasil!",
      data: gedung,
    });
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: "Gagal konek database: " + error.message,
    });
  }
});

// Jalankan Server
const server = app.listen(PORT, () => {
  console.log(`✅ Server SIMBIMA berjalan di http://localhost:${PORT}`);
});

// Handle port sudah dipakai
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} sudah dipakai proses lain!`);
    console.error(`   Jalankan perintah ini untuk membebaskan port:`);
    console.error(`   npx kill-port ${PORT}`);
    process.exit(1);
  } else {
    throw err;
  }
});

// Graceful shutdown saat Ctrl+C (SIGINT)
process.on("SIGINT", async () => {
  console.log("\n🛑 Server dimatikan (SIGINT)...");
  await prisma.$disconnect();
  server.close(() => {
    console.log("✅ Server berhasil dimatikan.");
    process.exit(0);
  });
});

// Graceful shutdown saat nodemon restart (SIGTERM)
process.on("SIGTERM", async () => {
  console.log("\n🔄 Nodemon restart — menutup server...");
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
});

// Graceful shutdown saat nodemon restart (SIGUSR2 — dipakai nodemon versi lama)
process.once("SIGUSR2", async () => {
  await prisma.$disconnect();
  server.close(() => {
    process.kill(process.pid, "SIGUSR2");
  });
});