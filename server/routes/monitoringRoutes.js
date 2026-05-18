const express = require("express");
const { getDashboardStats, tambahEvaluasi, getRiwayatEvaluasi } = require("../controllers/monitoringController");
const { verifyToken, isKetuaPokja } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute untuk melihat statistik dashboard
router.get("/dashboard", verifyToken, isKetuaPokja, getDashboardStats);

// Rute untuk input catatan evaluasi
router.post("/evaluasi", verifyToken, isKetuaPokja, tambahEvaluasi);

// Rute untuk ambil riwayat evaluasi
router.get("/evaluasi", verifyToken, isKetuaPokja, getRiwayatEvaluasi);

module.exports = router;