const express = require("express");
const { buatKegiatan, getDaftarKegiatan, inputKehadiran } = require("../controllers/kegiatanController");
const { verifyToken, isFasilitator } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute untuk melihat semua kegiatan
router.get("/", verifyToken, getDaftarKegiatan);

// Rute untuk membuat kegiatan baru (HANYA FASILITATOR)
router.post("/buat", verifyToken, isFasilitator, buatKegiatan);

// Rute untuk petugas menginput absensi (Semua yang login boleh akses, tapi divalidasi di controller)
router.post("/absen", verifyToken, inputKehadiran);

module.exports = router;