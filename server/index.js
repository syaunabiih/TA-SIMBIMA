// index.js
process.env.TZ = 'Asia/Jakarta';
const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const { Server } = require("socket.io");
const path = require("path");

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// ── Socket.io Setup ────────────────────────────────────────────────────────────
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const jwt = require('jsonwebtoken');

io.on("connection", (socket) => {
  console.log(`🔌 Socket terhubung: ${socket.id}`);

  // Join room berdasarkan user token
  socket.on("join-room", ({ token }) => {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || "rahasia_negara_simbima";
      const decoded = jwt.verify(token, JWT_SECRET);
      const roomName = `${decoded.role.toLowerCase()}-${decoded.id}`;
      socket.join(roomName);
      console.log(`📡 Socket ${socket.id} join room: ${roomName}`);
    } catch (_) { /* token invalid, skip */ }
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket terputus: ${socket.id}`);
  });
});

// Export io agar bisa dipakai di controller
module.exports = { io };

const authRoutes = require("./routes/authRoutes");
const kegiatanRoutes = require("./routes/kegiatanRoutes");
const izinRoutes = require("./routes/izinRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");
const mahasiswaRoutes = require("./routes/mahasiswaRoutes");
const rekapRoutes = require("./routes/rekapRoutes");
const notifikasiRoutes = require("./routes/notifikasiRoutes");
const dashboardRoutes  = require("./routes/dashboardRoutes");
const adminRoutes      = require("./routes/adminRoutes");
const pushRoutes       = require("./routes/pushRoutes");
const { initCronJobs } = require("./utils/cronJobs");

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
app.use("/api/push", pushRoutes);

// Folder statis untuk penyimpanan file bukti
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Healthcheck Route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

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

// Jalankan Server (httpServer, bukan app!)
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server SIMBIMA berjalan di http://localhost:${PORT}`);
  console.log(`🔌 Socket.io aktif`);
  
  // Inisialisasi cron jobs (pengecekan otomatis)
  initCronJobs();
});

// Handle port sudah dipakai
httpServer.on("error", (err) => {
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
  httpServer.close(() => {
    console.log("✅ Server berhasil dimatikan.");
    process.exit(0);
  });
});

// Graceful shutdown saat nodemon restart (SIGTERM)
process.on("SIGTERM", async () => {
  console.log("\n🔄 Nodemon restart — menutup server...");
  await prisma.$disconnect();
  httpServer.close(() => {
    process.exit(0);
  });
});

// Graceful shutdown saat nodemon restart (SIGUSR2 — dipakai nodemon versi lama)
process.once("SIGUSR2", async () => {
  await prisma.$disconnect();
  httpServer.close(() => {
    process.kill(process.pid, "SIGUSR2");
  });
});