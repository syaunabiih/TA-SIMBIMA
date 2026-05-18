const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Simpan di folder public/uploads
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    // Penamaan file: [timestamp]_[random].[ext]
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    cb(null, 'bukti-' + uniqueSuffix + ext);
  }
});

// Filter file: hanya menerima gambar dan dokumen PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Harap upload gambar (JPG/PNG/JPEG) atau file dokumen (PDF).'), false);
  }
};

// Batasan ukuran: Maks 5MB
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

module.exports = upload;
