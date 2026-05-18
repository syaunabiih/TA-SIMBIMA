const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "rahasia_negara_simbima";

// Middleware 1: Verifikasi apakah user punya Token (sudah login)
const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Akses ditolak! Token tidak ditemukan." });
  }

  try {
    // Membuang kata "Bearer " jika ada di depan token
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded; // Menyimpan data {id, role} ke dalam req untuk dipakai di controller
    next();
  } catch (error) {
    res.status(400).json({ message: "Token tidak valid atau sudah kadaluarsa!" });
  }
};

// Middleware 2: Khusus Fasilitator
const isFasilitator = (req, res, next) => {
  if (req.user.role !== "FASILITATOR") {
    return res.status(403).json({ message: "Akses ditolak! Hanya Fasilitator yang diizinkan." });
  }
  next();
};

// Middleware 3: Khusus Ketua Pokja (legacy)
const isKetuaPokja = (req, res, next) => {
  if (req.user.role !== "SUPERADMIN") {
    return res.status(403).json({ message: "Akses ditolak! Hanya Ketua Pokja (Superadmin) yang diizinkan." });
  }
  next();
};

/**
 * Middleware 4: requireRole — support string atau array role
 * Contoh:
 *   requireRole('SUPERADMIN')
 *   requireRole(['SUPERADMIN', 'FASILITATOR'])
 */
const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Akses ditolak! Role yang diizinkan: ${allowedRoles.join(", ")}.`,
      });
    }
    next();
  };
};

module.exports = { verifyToken, isFasilitator, isKetuaPokja, requireRole };