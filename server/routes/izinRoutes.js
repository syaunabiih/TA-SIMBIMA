const express = require("express");
const { getDaftarIzin, ajukanIzin, validasiIzin, konfirmasiIzin, getIzinDetail, uploadFotoBerangkat, uploadFotoPulang, getTotalHariBulanIni, batalkanIzin, getIzinSummary, konfirmasiKembali } = require("../controllers/izinController");
const { verifyToken, isFasilitator, requireRole } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

// Rute untuk melihat daftar perizinan (multi-role: mahasiswa, fasilitator, superadmin)
router.get("/", verifyToken, requireRole(["SUPERADMIN", "FASILITATOR", "MAHASISWA"]), getDaftarIzin);

// Summary perizinan (harus sebelum /:id_perizinan)
router.get("/summary", verifyToken, requireRole(["SUPERADMIN", "FASILITATOR"]), getIzinSummary);

// Rute untuk Mahasiswa mengajukan izin
router.post("/ajukan", verifyToken, upload.single("dokumen_pendukung"), ajukanIzin);

// Rute untuk Fasilitator memvalidasi izin (butuh ID perizinan di URL)
router.put("/validasi/:id_perizinan", verifyToken, isFasilitator, validasiIzin);

// Rute untuk melakukan upload dan simpan foto bukti konfirmasi (lama — dipertahankan)
router.post("/konfirmasi", verifyToken, upload.single("foto_bukti"), konfirmasiIzin);

// Rute upload foto berangkat & pulang (baru — via halaman detail)
router.post("/:id_perizinan/foto-berangkat", verifyToken, upload.single("foto"), uploadFotoBerangkat);
router.post("/:id_perizinan/foto-pulang", verifyToken, upload.single("foto"), uploadFotoPulang);

// Total hari izin mahasiswa bulan ini (untuk modal review fasilitator)
router.get("/mahasiswa/:id_mahasiswa/total-bulan-ini", verifyToken, isFasilitator, getTotalHariBulanIni);

// Rute untuk Mahasiswa membatalkan izin
router.patch("/:id_perizinan/batalkan", verifyToken, batalkanIzin);

// Konfirmasi kembali ke asrama (oleh Fasilitator)
router.patch("/:id_perizinan/konfirmasi-kembali", verifyToken, isFasilitator, konfirmasiKembali);

// Rute untuk mengambil 1 spesifik izin by ID (harus di bawah route spesifik)
router.get("/:id_perizinan", verifyToken, getIzinDetail);

module.exports = router;