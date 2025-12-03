// middleware/activeProfile.js
const User = require("../models/User");

// Helper to build profile object
const buildActiveProfile = (user, child = null) => {
  if (!child) {
    // Parent mode
    return {
      userId: user._id.toString(),
      firstName: `${user.firstName.trim()}`,
      lastName: `${user.lastName.trim()}`,
      phone: user.phone,
      email: user.email,
      type: "parent",
      isChild: false,
      childId: null,
      avatarUrl: user.avatarUrl || null,
      coins: user.coins || 0,
    };
  }

  // Child mode
  return {
    userId: child.childId,
    name: child.name,
    type: "child",
    isChild: true,
    childId: child.childId,
    avatarUrl: child.avatarUrl || "/avatars/child-default.png",
    coins: child.coins || 0,
  };
};

const getActiveUserId = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ error: { code: "UNAUTHENTICATED" } });
    }

    const user = await User.findById(req.user._id)
      .select(
        "firstName lastName avatarUrl email phone coins childProfiles activeProfileId"
      )
      .lean();

    if (!user) {
      return res.status(404).json({ error: { code: "USER_NOT_FOUND" } });
    }

    // Default: parent mode
    let activeProfile = buildActiveProfile(user);

    if (user.activeProfileId) {
      const child = user.childProfiles.find(
        (c) => c.childId === user.activeProfileId
      );
      if (child) {
        activeProfile = buildActiveProfile(user, child);
      } else {
        // Corrupted state → reset
        await User.updateOne(
          { _id: user._id },
          { $set: { activeProfileId: null } }
        );
      }
    }

    // Attach to req
    req.activeUserId = activeProfile.userId;
    req.activeProfile = activeProfile; // ← THIS WAS MISSING!
    req.activeProfileType = activeProfile.type; // parent or child
    req.isChildMode = activeProfile.isChild;

    next();
  } catch (err) {
    console.error("getActiveUserId error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
};

module.exports = { getActiveUserId };
