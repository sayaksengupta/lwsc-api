const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
} = require("../utils/token");
const { sendPasswordResetEmail } = require("../utils/email");
const jwt = require("jsonwebtoken");

const formatUserResponse = (user) => {
  const activeProfile = user.getActiveProfile();

  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    hasChildren: user.hasChildren,
    activeProfileId: user.activeProfileId,
    coins: activeProfile.coins,
    profiles: [
      {
        profileId: null,
        name: `${user.firstName} ${user.lastName}`.trim() + " (You)",
        type: "parent",
        avatarUrl: user.avatarUrl,
        coins: user.coins,
      },
      ...user.childProfiles.map((child) => ({
        profileId: child.childId,
        name: child.name,
        type: "child",
        age: child.age || user.calculateAge(child.dob),
        avatarUrl: child.avatarUrl,
        coins: child.coins,
        healthNotes: child.healthNotes,
      })),
    ],
  };
};

// REGISTER
const register = async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    childProfiles = [],
  } = req.body;

  // Check email/phone conflict
  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, phone ? { phone } : {}].filter(
      Boolean
    ),
  });

  if (existing) {
    return res.status(400).json({
      error: {
        code:
          existing.email === email.toLowerCase()
            ? "EMAIL_EXISTS"
            : "PHONE_EXISTS",
        message:
          existing.email === email.toLowerCase()
            ? "Email already in use"
            : "Phone number already registered",
      },
    });
  }

  const hashed = await bcrypt.hash(password, 12);

  // Process children — smart age calculation
  const processedChildren = childProfiles.map((child) => {
    let age = null;

    // If DOB is provided → calculate age
    if (child.dob) {
      const birthDate = new Date(child.dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // If age is manually provided → use it (but cap at 18 for safety)
    if (child.age !== undefined) {
      age = Math.min(18, Math.max(0, Number(child.age)));
    }

    return {
      name: child.name?.trim() || "My Child",
      age: age,
      dob: child.dob || null,
      healthNotes: child.healthNotes?.trim() || "",
      avatarUrl: child.avatarUrl || "/avatars/child-default.png",
      coins: 50,
    };
  });

  const user = await User.create({
    email: email.toLowerCase(),
    password: hashed,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone || null,
    childProfiles: processedChildren,
    activeProfileId:
      processedChildren.length > 0 ? processedChildren[0].childId : null,
    coins: 100,
  });

  const access = generateAccessToken(user._id);
  const refresh = generateRefreshToken(user._id);
  user.refreshToken = refresh;
  await user.save();

  res.status(201).json({
    success: true,
    user: formatUserResponse(user),
    token: {
      access,
      refresh,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  });
};

// LOGIN
const login = async (req, res) => {
  const { emailOrUsername, password } = req.body;
  const user = await User.findOne({ email: emailOrUsername.toLowerCase() });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    });
  }

  const access = generateAccessToken(user._id);
  const refresh = generateRefreshToken(user._id);
  user.refreshToken = refresh;
  await user.save();

  res.json({
    user: formatUserResponse(user),
    token: {
      access,
      refresh,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
  });
};

// REFRESH
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ error: { code: "MISSING_TOKEN" } });

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return res.status(401).json({ error: { code: "INVALID_REFRESH_TOKEN" } });
  }

  const user = await User.findOne({ _id: payload.sub, refreshToken });
  if (!user)
    return res.status(401).json({ error: { code: "INVALID_REFRESH_TOKEN" } });

  const access = generateAccessToken(user._id);
  const newRefresh = generateRefreshToken(user._id);
  user.refreshToken = newRefresh;
  await user.save();

  res.json({
    access,
    refresh: newRefresh,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });
};

// LOGOUT
const logout = async (req, res) => {
  if (req.user) {
    await User.updateOne(
      { _id: req.user._id },
      { $unset: { refreshToken: 1 } }
    );
  }
  res.json({ success: true });
};

// ME
const me = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ error: { code: "USER_NOT_FOUND" } });

  const active = user.getActiveProfile();

  res.json({
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    hasChildren: user.hasChildren,
    activeProfileId: user.activeProfileId,
    activeProfile: {
      profileId: active.profileId,
      name: active.name,
      type: active.type,
      coins: active.coins,
      avatarUrl: active.avatarUrl,
    },
    profiles: [
      {
        profileId: null,
        name: `${user.firstName} ${user.lastName} (You)`,
        type: "parent",
        coins: user.coins,
      },
      ...user.childProfiles.map((c) => ({
        profileId: c.childId,
        name: c.name,
        type: "child",
        age: user.calculateAge(c.dob) || c.age,
        coins: c.coins,
        avatarUrl: c.avatarUrl,
      })),
    ],
  });
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
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res
      .status(400)
      .json({ error: { code: "INVALID_OR_EXPIRED_TOKEN" } });
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
  resetPassword,
};
