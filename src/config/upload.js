// config/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
['uploads/badges', 'uploads/achievements'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const iconStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type || req.params.type;
    const folder = type === 'badge' ? 'uploads/badges' : 'uploads/achievements';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadIcon = multer({
  storage: iconStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|svg/;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = allowed.test(file.mimetype);
    if (mimetype && allowed.test(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, png, webp, svg) are allowed'));
  }
});

module.exports = { uploadIcon };