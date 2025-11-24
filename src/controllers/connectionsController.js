const Connection = require('../models/Connection');
const User = require('../models/User');

const list = async (req, res) => {
  const connections = await Connection.find({ userId: req.user._id })
    .sort({ name: 1 })
    .lean();
  res.json(connections);
};

const create = async (req, res) => {
  const { name, phone, relationship } = req.body;
  const currentUserId = req.user._id;

  // 1. Check if phone already exists as a connection
  const existingConnection = await Connection.findOne({
    userId: currentUserId,
    phone
  });

  if (existingConnection) {
    return res.status(400).json({
      error: {
        code: 'PHONE_EXISTS',
        message: 'You already have this person as a connection'
      }
    });
  }

  // 2. CRITICAL: Check if this phone belongs to a real user on the platform
  const targetUser = await User.findOne({ phone }).select('_id firstName lastName');

  if (!targetUser) {
    return res.status(400).json({
      error: {
        code: 'USER_NOT_ON_PLATFORM',
        message: 'This person hasn\'t joined the app yet. They need to sign up first!'
      }
    });
  }

  // Optional: Prevent adding yourself
  if (targetUser._id.toString() === currentUserId.toString()) {
    return res.status(400).json({
      error: {
        code: 'CANNOT_ADD_SELF',
        message: 'You cannot add yourself as a connection'
      }
    });
  }

  // 3. Create connection
  const connection = await Connection.create({
    userId: currentUserId,
    name: name || `${targetUser.firstName} ${targetUser.lastName}`.trim(),
    phone,
    relationship: relationship || null,
    isVerified: true // since we confirmed the user exists
  });

  res.status(201).json(connection);
};

const update = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // If updating phone → re-validate user exists
  if (updates.phone) {
    const targetUser = await User.findOne({ phone: updates.phone });
    if (!targetUser) {
      return res.status(400).json({
        error: {
          code: 'USER_NOT_ON_PLATFORM',
          message: 'Cannot update to a phone number not registered on the app'
        }
      });
    }
  }

  const connection = await Connection.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!connection) {
    return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  }

  res.json(connection);
};

const remove = async (req, res) => {
  const { id } = req.params;
  const result = await Connection.deleteOne({ _id: id, userId: req.user._id });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  }

  res.json({ success: true, message: 'Connection removed' });
};

module.exports = { list, create, update, remove };