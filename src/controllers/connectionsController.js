const Connection = require('../models/Connection');

const list = async (req, res) => {
  const connections = await Connection.find({ userId: req.user._id })
    .sort({ name: 1 })
    .lean();
  res.json(connections);
};

const create = async (req, res) => {
  const { name, phone, relationship } = req.body;

  const existing = await Connection.findOne({ userId: req.user._id, phone });
  if (existing) {
    return res.status(400).json({ error: { code: 'PHONE_EXISTS', message: 'Connection with this phone already exists' } });
  }

  const connection = await Connection.create({
    userId: req.user._id,
    name,
    phone,
    relationship
  });

  res.status(201).json(connection);
};

const update = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

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

  res.json({ success: true });
};

module.exports = { list, create, update, remove };