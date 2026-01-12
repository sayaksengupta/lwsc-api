const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');

// ── LOGIN ─────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: { code: 'MISSING_FIELDS', message: 'Email and password are required' }
    });
  }

  try {
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        error: { code: 'ACCOUNT_DISABLED', message: 'Admin account is disabled' }
      });
    }

    const accessToken = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: admin._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      accessToken,
      refreshToken,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR' } });
  }
};

// ── REFRESH TOKEN ─────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: { code: 'NO_REFRESH_TOKEN' } });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const admin = await Admin.findById(decoded.id);

    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN' } });
    }

    const newAccessToken = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN', message: 'Token expired or invalid' } });
  }
};

// ── GET CURRENT ADMIN ───────────────────────────────────────────────
const getMe = async (req, res) => {
  const admin = await Admin.findById(req.admin._id).select('-password');
  res.json({ admin });
};

// ── CHANGE PASSWORD ─────────────────────────────────────────────────
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS' } });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: { code: 'WEAK_PASSWORD' } });
  }

  const admin = await Admin.findById(req.admin._id);
  const isMatch = await admin.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({ error: { code: 'WRONG_CURRENT_PASSWORD' } });
  }

  admin.password = newPassword;
  await admin.save();

  res.json({ success: true, message: 'Password changed successfully' });
};

// ── UPDATE PROFILE ──────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    if (name) admin.name = name;
    if (email) admin.email = email.toLowerCase().trim();
    if (password) {
        if (password.length < 6) {
             return res.status(400).json({ error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters' } });
        }
        admin.password = password;
    }

    await admin.save();
    
    // Return updated info
    res.json({
        success: true,
        admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role
        }
    });
  } catch (err) {
      // Handle unique email error
      if (err.code === 11000) {
          return res.status(400).json({ error: { code: 'EMAIL_EXISTS', message: 'Email already currently in use' }});
      }
      res.status(500).json({ error: err.message });
  }
};

// ── LOGOUT (client-side only) ───────────────────────────────────────
const logout = (req, res) => {
  // If you add token blacklist later, revoke here
  res.json({ success: true, message: 'Logged out successfully' });
};

// ── FORGOT PASSWORD ─────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin) {
    return res.json({ success: true, message: 'If email exists, reset link sent' });
  }

  const resetToken = jwt.sign(
    { id: admin._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  admin.resetPasswordToken = resetToken;
  admin.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await admin.save();

  const resetLink = `${process.env.CLIENT_URL}/admin/reset-password?token=${resetToken}`;
  console.log('Password Reset Link:', resetLink);

  res.json({ success: true, message: 'Reset link sent (check console)' });
};

// ── RESET PASSWORD ──────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Valid token and strong password required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const admin = await Admin.findOne({
      _id: decoded.id,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    admin.password = newPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

module.exports = {
  login,
  refreshToken,
  getMe,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  updateProfile,
};