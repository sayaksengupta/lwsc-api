// routes/admin/rewards.js
const router = require('express').Router();
const { adminAuth } = require('../../middleware/adminAuth');
const { uploadIcon } = require('../../config/upload'); // <-- our multer config

const {
  createAchievement,
  listAchievements,
  createBadge,
  listBadges,
  updateBadge,
  deleteBadge
} = require('../../controllers/admin/rewardsController');

// ACHIEVEMENTS
router.post('/achievements', 
  adminAuth, 
  uploadIcon.single('icon'), 
  createAchievement
);

router.get('/achievements', adminAuth, listAchievements);

// BADGES
router.post('/badges', 
  adminAuth, 
  uploadIcon.single('icon'), 
  createBadge
);

router.get('/badges', adminAuth, listBadges);
router.patch('/badges/:id', 
  adminAuth, 
  uploadIcon.single('icon'), // allow updating icon
  updateBadge
);
router.delete('/badges/:id', adminAuth, deleteBadge);

module.exports = router;