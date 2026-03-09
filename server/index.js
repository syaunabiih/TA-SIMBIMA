// index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const authRoutes = require("./routes/authRoutes");

// Middleware
app.use(cors());
app.use(express.json()); // Agar bisa baca data JSON dari frontend
app.use("/api/auth", authRoutes);

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
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});