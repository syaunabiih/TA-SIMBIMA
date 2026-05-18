const express = require("express");
const { generateRekap, publikasiRekap, getDaftarRekapFasilitator, getDetailRekapBulanTahun, getRiwayatRekapMahasiswa, exportExcelRekap } = require("../controllers/rekapController");
const { verifyToken, isFasilitator, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute Fasilitator
router.post("/generate", verifyToken, isFasilitator, generateRekap);
router.post("/publikasi", verifyToken, isFasilitator, publikasiRekap);
router.get("/fasilitator", verifyToken, requireRole(["SUPERADMIN", "FASILITATOR"]), getDaftarRekapFasilitator);
// Route baru: detail by tanggal_mulai (YYYY-MM-DD passed as :bulan param)
router.get("/fasilitator/:bulan", verifyToken, requireRole(["SUPERADMIN", "FASILITATOR"]), getDetailRekapBulanTahun);
router.get("/fasilitator/:bulan/export-excel", verifyToken, requireRole(["SUPERADMIN", "FASILITATOR"]), exportExcelRekap);
// Route lama: backward compat
router.get("/fasilitator/:bulan/:tahun", verifyToken, requireRole(["SUPERADMIN", "FASILITATOR"]), getDetailRekapBulanTahun);
router.get("/fasilitator/:bulan/:tahun/export-excel", verifyToken, requireRole(["SUPERADMIN", "FASILITATOR"]), exportExcelRekap);


// Rute Mahasiswa
router.get("/mahasiswa", verifyToken, getRiwayatRekapMahasiswa);

module.exports = router;