const express = require("express");
const { buatKegiatan, getDaftarKegiatan, getMahasiswaAsrama, editKegiatan, hapusKegiatan, getKehadiranPerBlok, tutupPresensi, buatKehadiranFasil, editKehadiranFasil, cekKelengkapanAbsensi, alfaOtomatis, getQrToken, scanQr, cekKegiatanAktif } = require("../controllers/kegiatanController");
const { verifyToken, isFasilitator, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute untuk melihat semua kegiatan (SUPERADMIN & FASILITATOR)
router.get("/", verifyToken, requireRole(["SUPERADMIN", "FASILITATOR", "MAHASISWA"]), getDaftarKegiatan);

// Rute untuk membuat kegiatan baru (HANYA FASILITATOR)
router.post("/buat", verifyToken, isFasilitator, buatKegiatan);


// ── STATIC routes HARUS sebelum /:id agar tidak ter-shadow ──────────────────

// Edit kehadiran oleh fasilitator (POST baru, PUT update)
router.post("/kehadiran", verifyToken, isFasilitator, buatKehadiranFasil);
router.put("/kehadiran/:id", verifyToken, isFasilitator, editKehadiranFasil);

// Daftar mahasiswa asrama (khusus Fasilitator)
router.get("/mahasiswa-asrama", verifyToken, isFasilitator, getMahasiswaAsrama);



// Absensi via QR Code oleh mahasiswa (harus STATIC, sebelum /:id)
router.post("/scan-qr", verifyToken, scanQr);

// Cek apakah ada kegiatan BERLANGSUNG di asrama fasilitator (STATIC, sebelum /:id)
router.get("/cek-aktif", verifyToken, isFasilitator, cekKegiatanAktif);

// ── DYNAMIC routes /:id ──────────────────────────────────────────────────────

router.get("/:id/cek-absensi", verifyToken, isFasilitator, cekKelengkapanAbsensi);
router.get("/:id/qr-token", verifyToken, isFasilitator, getQrToken);
router.post("/:id/alfa-otomatis", verifyToken, isFasilitator, alfaOtomatis);
router.put("/:id/tutup", verifyToken, isFasilitator, tutupPresensi);
router.put("/:id_kegiatan", verifyToken, isFasilitator, editKegiatan);
router.delete("/:id_kegiatan", verifyToken, isFasilitator, hapusKegiatan);

// Kehadiran per blok (fasilitator & superadmin)
router.get("/:id/kehadiran", verifyToken, requireRole(["SUPERADMIN", "FASILITATOR"]), getKehadiranPerBlok);

module.exports = router;