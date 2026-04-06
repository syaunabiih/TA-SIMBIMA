const express = require("express");
const { getNotifikasi, tandaiDibaca } = require("../controllers/notifikasiController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute ambil daftar notifikasi (Semua role bisa akses)
router.get("/", verifyToken, getNotifikasi);

// Rute untuk update status_baca jadi true
router.put("/:id_notifikasi/baca", verifyToken, tandaiDibaca);

module.exports = router;