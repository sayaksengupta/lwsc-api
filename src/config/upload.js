// config/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');

// Ensure upload directories exist
['badges', 'achievements', 'pain-locations', 'articles'].forEach(subDir => {
  const dir = path.join(UPLOADS_ROOT, subDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const getRelativePath = (absolutePath) => {
  // Returns path relative to the root category, e.g., "/uploads/badges/file.png"
  const projectRoot = path.join(UPLOADS_ROOT, '..');
  const relative = path.relative(projectRoot, absolutePath).replace(/\\/g, '/');
  return `/${relative}`;
};

const iconStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'achievements';
    const type = req.body.type || req.params.type;
    
    if (type === 'badge') folder = 'badges';
    else if (type === 'pain-location') folder = 'pain-locations';
    else if (type === 'article') folder = 'articles';
    
    const dest = path.join(UPLOADS_ROOT, folder);
    cb(null, dest);
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

module.exports = { uploadIcon, UPLOADS_ROOT, getRelativePath };