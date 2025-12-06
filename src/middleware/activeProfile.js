// middleware/activeProfile.js
const User = require("../models/User");

// Helper: Build unified profile object (used everywhere)
const buildActiveProfile = (parentDoc, child = null) => {
  if (!child) {
    // ── Parent Mode ──
    return {
      userId: parentDoc._id.toString(),
      name: `${parentDoc.firstName || ""} ${parentDoc.lastName || ""}`.trim(),
      firstName: parentDoc.firstName?.trim() || null,
      lastName: parentDoc.lastName?.trim() || null,
      email: parentDoc.email || null,
      phone: parentDoc.phone || null,
      coins: parentDoc.coins || 0,
      avatarUrl: parentDoc.avatarUrl || null,
      type: "parent",
      isChild: false,
      childId: null,
      hasChildren: (parentDoc.childProfiles || []).length > 0,
    };
  }

  // ── Child Mode ──
  return {
    userId: child.childId,
    name: child.name || "Child",
    firstName: null,
    lastName: null,
    email: null,
    phone: null,
    coins: child.coins || 0,
    avatarUrl: child.avatarUrl || "/avatars/child-default.png",
    type: "child",
    isChild: true,
    childId: child.childId,
    hasChildren: false,
  };
};

const getActiveUserId = async (req, res, next) => {
  try {
    // 1. Must be authenticated
    if (!req.user?._id) {
      return res.status(401).json({ error: { code: "UNAUTHENTICATED" } });
    }

    const parentId = req.user._id;

    // 2. Fetch parent with all needed fields
    const parent = await User.findById(parentId)
      .select(
        `
        firstName 
        lastName 
        email 
        phone 
        coins 
        avatarUrl 
        childProfiles 
        activeProfileId
      `
      )
      .lean();

    if (!parent) {
      return res.status(404).json({ error: { code: "USER_NOT_FOUND" } });
    }

    // 3. Determine active profile
    let activeProfile;
    let activeChild = null;

    if (parent.activeProfileId) {
      activeChild = parent.childProfiles?.find(
        (c) => c.childId === parent.activeProfileId
      );

      if (activeChild) {
        activeProfile = buildActiveProfile(parent, activeChild);
      } else {
        // Corrupted activeProfileId → auto-fix
        console.warn(`Fixing corrupted activeProfileId for user ${parentId}`);
        await User.updateOne(
          { _id: parentId },
          { $set: { activeProfileId: null } }
        );
        activeProfile = buildActiveProfile(parent);
      }
    } else {
      // Default: parent mode
      activeProfile = buildActiveProfile(parent);
    }

    // 4. Attach everything useful to req
    req.activeUserId = activeProfile.userId; // ID used in logs, coins, etc.
    req.activeProfile = activeProfile; // Full profile object
    req.activeProfileType = activeProfile.type; // "parent" or "child"
    req.isChildMode = activeProfile.isChild;

    // Extra helpers — super useful in controllers
    req.parentUser = parent; // Full parent document (with children array)
    req.activeChild = activeChild; // null or child object

    next();
  } catch (err) {
    console.error("getActiveUserId middleware error:", err);
    res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
};

module.exports = { getActiveUserId };
