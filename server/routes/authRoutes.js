const express = require("express");
const { login } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Rute untuk Login (Bebas akses)
router.post("/login", login);

// Rute untuk Reset Password (Bebas akses)
router.post("/reset-password", resetPassword);

// Rute untuk mengecek profil user yang sedang login (Wajib pakai token)
router.get("/me", verifyToken, (req, res) => {
  res.json({
    status: "Sukses",
    message: "Akses berhasil karena token valid",
    user_terverifikasi: req.user // Ini akan menampilkan { id, role, iat, exp }
  });
});

module.exports = router;