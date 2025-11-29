const User = require("../models/User");

// Helper: Build ActiveProfileInfo object
const buildActiveProfileInfo = (user, activeChild = null) => {
  if (!activeChild) {
    // Parent is active
    return {
      name: `${user.firstName} ${user.lastName}`,
      type: "parent",
      isChild: false,
      childId: null,
      avatarUrl: user.avatarUrl || null,
    };
  }

  // Child is active
  return {
    name: activeChild.name,
    type: "child",
    isChild: true,
    childId: activeChild.childId,
    avatarUrl: activeChild.avatarUrl || null,
  };
};

// GET /profile/active
const getActiveProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ error: { code: "USER_NOT_FOUND" } });

    const activeChild = user.childProfiles.find(
      (c) => c.childId === user.activeProfileId
    );

    res.json(buildActiveProfileInfo(user, activeChild));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
};

// GET /profile/list
const listProfiles = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ error: { code: "USER_NOT_FOUND" } });

    const profiles = [
      {
        name: `${user.firstName} ${user.lastName}`,
        type: "parent",
        isChild: false,
        childId: null,
        avatarUrl: user.avatarUrl || null,
      },
      ...user.childProfiles.map((child) => ({
        name: child.name,
        type: "child",
        isChild: true,
        childId: child.childId,
        avatarUrl: child.avatarUrl || null,
      })),
    ];

    res.json(profiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
};

// POST /profile/switch
const switchProfile = async (req, res) => {
  const { childId } = req.body; // null, "parent", or childId string

  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ error: { code: "USER_NOT_FOUND" } });

    // Allow switching to parent by sending null or "parent"
    const targetChildId =
      childId === "parent" || childId === null || childId === ""
        ? null
        : childId;

    // Validate child exists if not switching to parent
    if (targetChildId) {
      const childExists = user.childProfiles.some(
        (c) => c.childId === targetChildId
      );
      if (!childExists) {
        return res.status(400).json({ error: { code: "INVALID_CHILD_ID" } });
      }
    }

    user.activeProfileId = targetChildId;
    await user.save();

    const activeChild = targetChildId
      ? user.childProfiles.find((c) => c.childId === targetChildId)
      : null;

    res.json(buildActiveProfileInfo(user, activeChild));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
};

module.exports = {
  getActiveProfile,
  listProfiles,
  switchProfile,
};
