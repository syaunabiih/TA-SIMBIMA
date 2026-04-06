const express = require("express");
const { getProfilDanRiwayat } = require("../controllers/mahasiswaController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute untuk mahasiswa melihat profil dan histori absennya
router.get("/riwayat", verifyToken, getProfilDanRiwayat);

module.exports = router;
