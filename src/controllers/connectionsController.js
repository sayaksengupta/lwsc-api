const Connection = require("../models/Connection");
const User = require("../models/User");

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
    phone,
  });

  if (existingConnection) {
    return res.status(400).json({
      error: {
        code: "PHONE_EXISTS",
        message: "You already have this person as a connection",
      },
    });
  }

  // 2. CRITICAL: Check if this phone belongs to a real user on the platform
  const targetUser = await User.findOne({ phone }).select(
    "_id firstName lastName"
  );

  if (!targetUser) {
    return res.status(400).json({
      error: {
        code: "USER_NOT_ON_PLATFORM",
        message:
          "This person hasn't joined the app yet. They need to sign up first!",
      },
    });
  }

  // Optional: Prevent adding yourself
  if (targetUser._id.toString() === currentUserId.toString()) {
    return res.status(400).json({
      error: {
        code: "CANNOT_ADD_SELF",
        message: "You cannot add yourself as a connection",
      },
    });
  }

  // 3. Create connection
  const connection = await Connection.create({
    userId: currentUserId,
    name: name || `${targetUser.firstName} ${targetUser.lastName}`.trim(),
    phone,
    relationship: relationship || null,
    isVerified: true, // since we confirmed the user exists
  });

  res.status(201).json(connection);
};

const bulkCreate = async (req, res) => {
  const { contacts } = req.body; // [{ phone: "+923001234567", name?: "Aisha", relationship?: "Friend" }, ...]
  const currentUserId = req.user._id;

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({
      error: { code: "INVALID_INPUT", message: "contacts array is required" },
    });
  }

  if (contacts.length > 100) {
    return res.status(400).json({
      error: {
        code: "TOO_MANY_CONTACTS",
        message: "Maximum 100 contacts at a time",
      },
    });
  }

  // 1. Extract phones
  const phones = contacts.map((c) => c.phone).filter(Boolean);
  if (phones.length === 0) {
    return res.status(400).json({
      error: {
        code: "NO_VALID_PHONES",
        message: "No valid phone numbers provided",
      },
    });
  }

  // 2. Check which phones belong to real users
  const realUsers = await User.find({ phone: { $in: phones } })
    .select("phone firstName lastName")
    .lean();

  const realPhoneMap = new Map(realUsers.map((u) => [u.phone, u]));

  // 3. Check existing connections to avoid duplicates
  const existing = await Connection.find({
    userId: currentUserId,
    phone: { $in: phones },
  }).select("phone");

  const existingPhones = new Set(existing.map((c) => c.phone));

  // 4. Build valid connections to insert
  const toInsert = [];
  const skipped = [];
  const added = [];

  for (const contact of contacts) {
    const phone = contact.phone?.trim();
    if (!phone || !realPhoneMap.has(phone)) {
      skipped.push({ phone, reason: "not_on_app" });
      continue;
    }

    if (existingPhones.has(phone)) {
      skipped.push({ phone, reason: "already_added" });
      continue;
    }

    if (realPhoneMap.get(phone)._id.toString() === currentUserId.toString()) {
      skipped.push({ phone, reason: "is_self" });
      continue;
    }

    const targetUser = realPhoneMap.get(phone);
    toInsert.push({
      userId: currentUserId,
      phone,
      name:
        contact.name?.trim() ||
        `${targetUser.firstName} ${targetUser.lastName}`.trim(),
      relationship: contact.relationship?.trim() || null,
      isVerified: true,
    });

    added.push({
      phone,
      name:
        contact.name?.trim() ||
        `${targetUser.firstName} ${targetUser.lastName}`.trim(),
    });
  }

  // 5. Bulk insert if any
  let created = [];
  if (toInsert.length > 0) {
    created = await Connection.insertMany(toInsert);
  }

  res.status(201).json({
    success: true,
    addedCount: added.length,
    skippedCount: skipped.length,
    added,
    skipped,
    totalProcessed: contacts.length,
  });
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
          code: "USER_NOT_ON_PLATFORM",
          message: "Cannot update to a phone number not registered on the app",
        },
      });
    }
  }

  const connection = await Connection.findOneAndUpdate(
    { _id: id, userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!connection) {
    return res.status(404).json({ error: { code: "NOT_FOUND" } });
  }

  res.json(connection);
};

const remove = async (req, res) => {
  const { id } = req.params;
  const result = await Connection.deleteOne({ _id: id, userId: req.user._id });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: { code: "NOT_FOUND" } });
  }

  res.json({ success: true, message: "Connection removed" });
};

const findFriendsOnApp = async (req, res) => {
  let { phones } = req.body;

  // ── 1. Input validation (fast fail)
  if (!phones || !Array.isArray(phones) || phones.length === 0) {
    return res.status(400).json({
      error: { code: "INVALID_PHONES", message: "Phones array is required" },
    });
  }

  // ── 2. Normalize + dedupe + limit (5000 max)
  const phoneSet = new Set();
  const normalized = [];

  for (const p of phones) {
    if (typeof p !== "string") continue;
    const cleaned = p.trim();
    if (cleaned && cleaned.length >= 10 && cleaned.length <= 20) {
      if (!phoneSet.has(cleaned)) {
        phoneSet.add(cleaned);
        normalized.push(cleaned);
        if (normalized.length >= 5000) break; // hard cap
      }
    }
  }

  if (normalized.length === 0) {
    return res.json({ success: true, matches: [], notOnApp: [] });
  }

  try {
    // ── 3. Single indexed query (fastest possible)
    const existingUsers = await User.find(
      { phone: { $in: normalized } },
      { phone: 1, firstName: 1, lastName: 1, _id: 0 } // only what we need
    )
      .lean()
      .exec();

    // ── 4. Build lookup map (O(n) → fastest possible)
    const foundMap = new Map();
    const matches = [];

    for (const user of existingUsers) {
      const key = user.phone;
      if (!foundMap.has(key)) {
        foundMap.set(key, true);
        matches.push({
          phone: user.phone,
          name:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
          isOnApp: true,
        });
      }
    }

    // ── 5. Not found (only if you want to send invite option)
    const notOnApp = normalized
      .filter((phone) => !foundMap.has(phone))
      .map((phone) => ({ phone, isOnApp: false }));

    // ── 6. Response
    res.json({
      success: true,
      matches,
      notOnApp,
    });
  } catch (error) {
    console.error("findFriendsOnApp error:", error);
    res.status(500).json({ error: { code: "SERVER_ERROR" } });
  }
};

module.exports = { list, create, bulkCreate, update, remove, findFriendsOnApp };
