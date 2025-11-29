// middleware/activeProfile.js
const User = require("../models/User");

const getActiveUserId = async (req, res, next) => {
  try {
    // req.user comes from JWT auth middleware
    if (!req.user?._id) {
      return res.status(401).json({ error: { code: "UNAUTHENTICATED" } });
    }

    const parent = await User.findById(req.user._id)
      .select("activeProfileId childProfiles")
      .lean();

    if (!parent) {
      return res.status(404).json({ error: { code: "USER_NOT_FOUND" } });
    }

    // Parent mode
    if (!parent.activeProfileId) {
      req.activeUserId = req.user._id;
      req.activeProfileType = "parent";
      return next();
    }

    // Child mode — validate child belongs to parent
    const child = parent.childProfiles.find(
      (c) => c.childId === parent.activeProfileId
    );
    if (!child) {
      // Auto-fix corrupted state
      await User.updateOne(
        { _id: req.user._id },
        { $set: { activeProfileId: null } }
      );
      req.activeUserId = req.user._id;
      req.activeProfileType = "parent";
      return next();
    }

    req.activeUserId = parent.activeProfileId;
    req.activeProfileType = "child";
    req.activeChildName = child.name; // optional, useful for logs
    next();
  } catch (err) {
    console.error("getActiveUserId error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
};

module.exports = { getActiveUserId };
