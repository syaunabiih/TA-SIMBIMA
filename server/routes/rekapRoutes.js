const express = require("express");
const { generateRekap, publikasiRekap } = require("../controllers/rekapController");
const { verifyToken, isFasilitator } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute untuk mengkalkulasi ulang/generate rekapitulasi (masuk jadi DRAFT)
router.post("/generate", verifyToken, isFasilitator, generateRekap);

// Rute untuk mempublikasikan DRAFT menjadi PUBLISHED
router.post("/publikasi", verifyToken, isFasilitator, publikasiRekap);

module.exports = router;