const express = require("express");
const { getDashboardStats, tambahEvaluasi } = require("../controllers/monitoringController");
const { verifyToken, isKetuaPokja } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute untuk melihat statistik dashboard
router.get("/dashboard", verifyToken, isKetuaPokja, getDashboardStats);

// Rute untuk input catatan evaluasi
router.post("/evaluasi", verifyToken, isKetuaPokja, tambahEvaluasi);

module.exports = router;