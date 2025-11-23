// routes/admin/auth.js
const router = require('express').Router();
const {
  login,
  getMe,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken
} = require('../../controllers/admin/authController');
const { adminAuth } = require('../../middleware/adminAuth');

// Public routes
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);

// Protected routes
router.get('/me', adminAuth, getMe);
router.post('/change-password', adminAuth, changePassword);
router.post('/logout', adminAuth, logout);

module.exports = router;