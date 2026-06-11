const express = require("express");
const {
  getFasilitatorList,
  tambahFasilitator,
  editFasilitator,
  hapusFasilitator,
  getMahasiswaList,
  getDashboardStats,
  getKehadiranPerGedung,
  getGedungList,
  tambahGedung,
  editGedung,
  hapusGedung,
  getTahunAkademik,
  tambahTahunAkademik,
  editTahunAkademik,
  hapusTahunAkademik,
  setAktifTahunAkademik,
  setNonaktifTahunAkademik,
  getFakultasList,
  tambahFakultas,
  editFakultas,
  hapusFakultas,
  getJurusanList,
  tambahJurusan,
  editJurusan,
  hapusJurusan,
  getJenisKegiatanList,
  tambahJenisKegiatan,
  editJenisKegiatan,
  hapusJenisKegiatan,
} = require("../controllers/adminController");
const { exportLaporanMonitoring } = require("../controllers/reportExportController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// Semua route /api/admin/* hanya bisa diakses SUPERADMIN
const isSuperAdmin = [verifyToken, requireRole("SUPERADMIN")];
// Exception: GET /jenis-kegiatan bisa diakses FASILITATOR juga (spec §7)
const isSuperOrFasil = [verifyToken, requireRole(["SUPERADMIN", "FASILITATOR"])];

// ── DASHBOARD STATS ──────────────────────────────────────────
router.get("/dashboard-stats", ...isSuperAdmin, getDashboardStats);
router.get("/dashboard/kehadiran-per-gedung", ...isSuperAdmin, getKehadiranPerGedung);

// ── LAPORAN EXPORT ───────────────────────────────────────────
router.get("/laporan/export", ...isSuperAdmin, exportLaporanMonitoring);

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
router.patch("/tahun-akademik/:id/nonaktif", ...isSuperAdmin, setNonaktifTahunAkademik);

// ── FAKULTAS CRUD ─────────────────────────────────────────────
router.get("/fakultas", ...isSuperAdmin, getFakultasList);
router.post("/fakultas", ...isSuperAdmin, tambahFakultas);
router.put("/fakultas/:id", ...isSuperAdmin, editFakultas);
router.delete("/fakultas/:id", ...isSuperAdmin, hapusFakultas);

// ── JURUSAN CRUD ──────────────────────────────────────────────
router.get("/jurusan", ...isSuperAdmin, getJurusanList);
router.post("/jurusan", ...isSuperAdmin, tambahJurusan);
router.put("/jurusan/:id", ...isSuperAdmin, editJurusan);
router.delete("/jurusan/:id", ...isSuperAdmin, hapusJurusan);

// ── FASILITATOR CRUD ─────────────────────────────────────────
router.get("/fasilitator", ...isSuperAdmin, getFasilitatorList);
router.post("/fasilitator", ...isSuperAdmin, tambahFasilitator);
router.put("/fasilitator/:id", ...isSuperAdmin, editFasilitator);
router.delete("/fasilitator/:id", ...isSuperAdmin, hapusFasilitator);

// ── MAHASISWA CRUD ───────────────────────────────────────────
router.get("/mahasiswa", ...isSuperAdmin, getMahasiswaList);

// ── JENIS KEGIATAN CRUD ──────────────────────────────────────────
router.get("/jenis-kegiatan", ...isSuperOrFasil, getJenisKegiatanList);
router.post("/jenis-kegiatan", ...isSuperAdmin, tambahJenisKegiatan);
router.put("/jenis-kegiatan/:id", ...isSuperAdmin, editJenisKegiatan);
router.delete("/jenis-kegiatan/:id", ...isSuperAdmin, hapusJenisKegiatan);

module.exports = router;
