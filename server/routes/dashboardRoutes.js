const express = require("express");
const { getDashboardFasilitator, getDashboardMahasiswa, getPerluPerhatian } = require("../controllers/dashboardController");
const { verifyToken, isFasilitator } = require("../middlewares/authMiddleware");

const router = express.Router();

// Dashboard data agregasi untuk Fasilitator
router.get("/fasilitator", verifyToken, isFasilitator, getDashboardFasilitator);

// Perlu Perhatian — semua mahasiswa bermasalah (tanpa limit)
router.get("/fasilitator/perlu-perhatian", verifyToken, isFasilitator, getPerluPerhatian);

// Dashboard data agregasi untuk Mahasiswa
router.get("/mahasiswa", verifyToken, getDashboardMahasiswa);

module.exports = router;
