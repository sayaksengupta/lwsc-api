const PainLocation = require("../models/PainLocation");

// Public/User: List all active pain locations
const list = async (req, res) => {
  const locations = await PainLocation.find({ isActive: true }).sort({ name: 1 }).lean();
  res.json(locations);
};

// Admin: List all pain locations (including inactive)
const adminList = async (req, res) => {
  const locations = await PainLocation.find().sort({ name: 1 }).lean();
  res.json(locations);
};

// Admin: Create a new pain location
const create = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const logo = req.file ? `/uploads/pain-locations/${req.file.filename}` : null;
    
    const location = await PainLocation.create({ name, isActive, logo });
    res.status(201).json(location);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: { message: "Location name already exists" } });
    }
    res.status(500).json({ error: { message: error.message } });
  }
};

// Admin: Update a pain location
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
    
    const updateData = { name, isActive };
    if (req.file) {
      updateData.logo = `/uploads/pain-locations/${req.file.filename}`;
    }
    
    const location = await PainLocation.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({ error: { message: "Location not found" } });
    }

    res.json(location);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: { message: "Location name already exists" } });
    }
    res.status(500).json({ error: { message: error.message } });
  }
};

// Admin: Delete a pain location
const remove = async (req, res) => {
  const { id } = req.params;
  const result = await PainLocation.findByIdAndDelete(id);

  if (!result) {
    return res.status(404).json({ error: { message: "Location not found" } });
  }

  res.json({ success: true, message: "Pain location deleted" });
};

module.exports = {
  list,
  adminList,
  create,
  update,
  remove,
};
