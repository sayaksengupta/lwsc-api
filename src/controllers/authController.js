const bcrypt = require('bcryptjs');
const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken
} = require('../utils/token');
const { sendPasswordResetEmail } = require('../utils/email');
const jwt = require('jsonwebtoken');

const formatUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  settings: user.settings
});

// REGISTER
const register = async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: { code: 'EMAIL_EXISTS', message: 'Email already in use' } });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password: hashed,
    firstName,
    lastName,
    phone
  });

  const access = generateAccessToken(user._id);
  const refresh = generateRefreshToken(user._id);
  user.refreshToken = refresh;
  await user.save();

  res.json({
    user: formatUser(user),
    token: {
      access,
      refresh,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }
  });
};

// LOGIN
const login = async (req, res) => {
  const { emailOrUsername, password } = req.body;
  const user = await User.findOne({ email: emailOrUsername.toLowerCase() });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
  }

  const access = generateAccessToken(user._id);
  const refresh = generateRefreshToken(user._id);
  user.refreshToken = refresh;
  await user.save();

  res.json({
    user: formatUser(user),
    token: {
      access,
      refresh,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }
  });
};

// REFRESH
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: { code: 'MISSING_TOKEN' } });

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN' } });
  }

  const user = await User.findOne({ _id: payload.sub, refreshToken });
  if (!user) return res.status(401).json({ error: { code: 'INVALID_REFRESH_TOKEN' } });

  const access = generateAccessToken(user._id);
  const newRefresh = generateRefreshToken(user._id);
  user.refreshToken = newRefresh;
  await user.save();

  res.json({
    access,
    refresh: newRefresh,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  });
};

// LOGOUT
const logout = async (req, res) => {
  if (req.user) {
    await User.updateOne({ _id: req.user._id }, { $unset: { refreshToken: 1 } });
  }
  res.json({ success: true });
};

// ME
const me = (req, res) => {
  res.json(formatUser(req.user));
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists
    return res.json({ success: true });
  }

  const token = generateResetToken();
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  await sendPasswordResetEmail(email, token);
  res.json({ success: true });
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ error: { code: 'INVALID_OR_EXPIRED_TOKEN' } });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ success: true });
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword
};