const User = require("../../models/User");
const { getPagination } = require("../../utils/pagination");

// List all users with pagination and search
const listUsers = async (req, res) => {
  try {
    const { page, pageSize, search } = req.query;
    const { skip, limit } = getPagination(page, pageSize);

    const query = {};
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, "i") },
        { lastName: new RegExp(search, "i") },
        { email: new RegExp(search, "i") },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      data: users,
      meta: {
        page: parseInt(page) || 1,
        pageSize: limit,
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// Get single user details
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -refreshToken");
    if (!user) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: error.message } });
  }
};

// Toggle user status (isActive) - wait, User model doesn't have isActive. 
// Let's assume we might want to delete or block them in the future.
// For now, let's just provide delete functionality.

const deleteUser = async (req, res) => {
  try {
    const result = await User.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found" } });
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: error.message } });
  }
};

module.exports = {
  listUsers,
  getUser,
  deleteUser,
};
