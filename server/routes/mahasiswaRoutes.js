const express = require("express");
const { 
  getProfilDanRiwayat, 
  getDaftarMahasiswaFasilitator,
  tambahMahasiswaFasilitator,
  editMahasiswaFasilitator,
  nonaktifkanMahasiswaFasilitator,
  aktifkanMahasiswaFasilitator,
  resetPasswordMahasiswaFasilitator,
  importMahasiswaFasilitator,
  downloadTemplateMahasiswa
} = require("../controllers/mahasiswaController");
const { getFakultasList, getJurusanList } = require("../controllers/adminController");
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute untuk mahasiswa melihat profil dan histori absennya
router.get("/riwayat", verifyToken, getProfilDanRiwayat);

// Rute untuk fasilitator mengelola daftar mahasiswa di gedungnya
router.get("/fasilitator-list", verifyToken, requireRole("FASILITATOR"), getDaftarMahasiswaFasilitator);
router.post("/fasilitator-tambah", verifyToken, requireRole("FASILITATOR"), tambahMahasiswaFasilitator);
router.put("/fasilitator-edit/:id", verifyToken, requireRole("FASILITATOR"), editMahasiswaFasilitator);
router.patch("/fasilitator-nonaktif/:id", verifyToken, requireRole("FASILITATOR"), nonaktifkanMahasiswaFasilitator);
router.patch("/fasilitator-aktif/:id", verifyToken, requireRole("FASILITATOR"), aktifkanMahasiswaFasilitator);
router.patch("/fasilitator-reset-password/:id", verifyToken, requireRole("FASILITATOR"), resetPasswordMahasiswaFasilitator);
router.post("/fasilitator-import", verifyToken, requireRole("FASILITATOR"), importMahasiswaFasilitator);
router.get("/fasilitator-template", verifyToken, requireRole("FASILITATOR"), downloadTemplateMahasiswa);

// Master Data Fakultas & Jurusan (bisa diakses Fasilitator)
router.get("/fakultas-list", verifyToken, requireRole("FASILITATOR"), getFakultasList);
router.get("/jurusan-list", verifyToken, requireRole("FASILITATOR"), getJurusanList);

module.exports = router;
