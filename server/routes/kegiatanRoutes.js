const express = require("express");
const { buatKegiatan, getDaftarKegiatan, inputKehadiran } = require("../controllers/kegiatanController");
const { verifyToken, isFasilitator } = require("../middlewares/authMiddleware");
const { editKegiatan, hapusKegiatan } = require("../controllers/kegiatanController");

const router = express.Router();

// Rute untuk melihat semua kegiatan
router.get("/", verifyToken, getDaftarKegiatan);

// Rute untuk membuat kegiatan baru (HANYA FASILITATOR)
router.post("/buat", verifyToken, isFasilitator, buatKegiatan);

// Rute untuk petugas menginput absensi (Semua yang login boleh akses, tapi divalidasi di controller)
router.post("/absen", verifyToken, inputKehadiran);

router.put("/:id_kegiatan", verifyToken, isFasilitator, editKegiatan);
router.delete("/:id_kegiatan", verifyToken, isFasilitator, hapusKegiatan);

module.exports = router;