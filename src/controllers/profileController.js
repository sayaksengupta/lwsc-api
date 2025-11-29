const User = require("../models/User");

const switchProfile = async (req, res) => {
    const { profileId } = req.body; // null or childId
  
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: { code: 'USER_NOT_FOUND' } });
  
    // Validate if profileId is valid child
    if (profileId) {
      const childExists = user.childProfiles.some(c => c.childId === profileId);
      if (!childExists) {
        return res.status(400).json({ error: { code: 'INVALID_PROFILE' } });
      }
    }
  
    user.activeProfileId = profileId || null;
    await user.save();
  
    // Return fresh user object with profiles
    res.json({
      success: true,
      user: {
        id: user._id,
        hasChildren: user.hasChildren,
        activeProfileId: user.activeProfileId,
        profiles: [
          { profileId: null, name: `${user.firstName} ${user.lastName} (You)`, type: 'parent' },
          ...user.childProfiles.map(c => ({
            profileId: c.childId,
            name: c.name,
            type: 'child',
            age: user.calculateAge(c.dob) || c.age,
            avatarUrl: c.avatarUrl,
            coins: c.coins
          }))
        ]
      }
    });
  };
  
  module.exports = { switchProfile };