const express = require("express");
const { getNotifikasi, tandaiDibaca, tandaiSemuaDibaca } = require("../controllers/notifikasiController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute ambil daftar notifikasi (Semua role bisa akses)
router.get("/", verifyToken, getNotifikasi);

// Rute untuk update status_baca jadi true
router.put("/:id_notifikasi/baca", verifyToken, tandaiDibaca);

// Rute untuk update semua notifikasi jadi dibaca
router.put("/tandai-semua", verifyToken, tandaiSemuaDibaca);

module.exports = router;