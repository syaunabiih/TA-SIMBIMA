const express = require("express");
const { getDashboardStats } = require("../controllers/monitoringController");
const { verifyToken, isKetuaPokja } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute untuk melihat statistik dashboard
router.get("/dashboard", verifyToken, isKetuaPokja, getDashboardStats);

module.exports = router;