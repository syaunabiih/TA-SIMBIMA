const express = require("express");
const {
  getFasilitatorList,
  tambahFasilitator,
  editFasilitator,
  hapusFasilitator,
  getMahasiswaList,
  tambahMahasiswa,
  editMahasiswa,
  hapusMahasiswa,
  getDashboardStats,
  getGedungList,
  tambahGedung,
  editGedung,
  hapusGedung,
  getTahunAkademik,
  tambahTahunAkademik,
  editTahunAkademik,
  hapusTahunAkademik,
  setAktifTahunAkademik,
  getJenisKegiatanMaster,
  tambahJenisKegiatan,
  editJenisKegiatan,
  hapusJenisKegiatan,
} = require("../controllers/adminController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// Semua route /api/admin/* hanya bisa diakses SUPERADMIN
const isSuperAdmin = [verifyToken, requireRole("SUPERADMIN")];
// Exception: GET /jenis-kegiatan bisa diakses FASILITATOR juga (spec §7)
const isSuperOrFasil = [verifyToken, requireRole(["SUPERADMIN", "FASILITATOR"])];

// ── DASHBOARD STATS ──────────────────────────────────────────
router.get("/dashboard-stats", ...isSuperAdmin, getDashboardStats);

// ── GEDUNG CRUD ───────────────────────────────────────────────
router.get("/gedung", ...isSuperAdmin, getGedungList);
router.post("/gedung", ...isSuperAdmin, tambahGedung);
router.put("/gedung/:id", ...isSuperAdmin, editGedung);
router.delete("/gedung/:id", ...isSuperAdmin, hapusGedung);

// ── TAHUN AKADEMIK CRUD ───────────────────────────────────────
router.get("/tahun-akademik", ...isSuperAdmin, getTahunAkademik);
router.post("/tahun-akademik", ...isSuperAdmin, tambahTahunAkademik);
router.put("/tahun-akademik/:id", ...isSuperAdmin, editTahunAkademik);
router.delete("/tahun-akademik/:id", ...isSuperAdmin, hapusTahunAkademik);
router.patch("/tahun-akademik/:id/aktif", ...isSuperAdmin, setAktifTahunAkademik);

// ── JENIS KEGIATAN MASTER CRUD ────────────────────────────────
router.get("/jenis-kegiatan", ...isSuperOrFasil, getJenisKegiatanMaster);
router.post("/jenis-kegiatan", ...isSuperAdmin, tambahJenisKegiatan);
router.put("/jenis-kegiatan/:id", ...isSuperAdmin, editJenisKegiatan);
router.delete("/jenis-kegiatan/:id", ...isSuperAdmin, hapusJenisKegiatan);

// ── FASILITATOR CRUD ─────────────────────────────────────────
router.get("/fasilitator", ...isSuperAdmin, getFasilitatorList);
router.post("/fasilitator", ...isSuperAdmin, tambahFasilitator);
router.put("/fasilitator/:id", ...isSuperAdmin, editFasilitator);
router.delete("/fasilitator/:id", ...isSuperAdmin, hapusFasilitator);

// ── MAHASISWA CRUD ───────────────────────────────────────────
router.get("/mahasiswa", ...isSuperAdmin, getMahasiswaList);
router.post("/mahasiswa", ...isSuperAdmin, tambahMahasiswa);
router.put("/mahasiswa/:id", ...isSuperAdmin, editMahasiswa);
router.delete("/mahasiswa/:id", ...isSuperAdmin, hapusMahasiswa);

module.exports = router;
