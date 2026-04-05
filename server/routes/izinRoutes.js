const express = require("express");
const { ajukanIzin, validasiIzin, konfirmasiIzin } = require("../controllers/izinController");
const { verifyToken, isFasilitator } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute untuk Mahasiswa mengajukan izin
router.post("/ajukan", verifyToken, ajukanIzin);

// Rute untuk Fasilitator memvalidasi izin (butuh ID perizinan di URL)
router.put("/validasi/:id_perizinan", verifyToken, isFasilitator, validasiIzin);

router.post("/konfirmasi", verifyToken, konfirmasiIzin);

module.exports = router;