const express = require("express");
const { login, requestResetPassword, processResetPassword, getProfile, updateProfile, changePassword, firstLoginPasswordChange } = require("../controllers/authController");
const { verifyToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// 1. Rute Public
router.post("/login", login);
router.post("/lupa-password", requestResetPassword);
router.post("/reset-password", processResetPassword);

// 2. Rute Private (Butuh Token)
router.get("/profil", verifyToken, getProfile);
router.put("/profil", verifyToken, updateProfile);
router.put("/profil/password", verifyToken, changePassword);
router.put("/first-login/password", verifyToken, firstLoginPasswordChange);

module.exports = router;