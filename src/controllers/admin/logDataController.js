const PainLog = require("../../models/PainLog");
const MoodLog = require("../../models/MoodLog");
const HydrationLog = require("../../models/HydrationLog");
const MedicationIntake = require("../../models/MedicationIntake");
const { getPagination } = require("../../utils/pagination");

// ── HELPERS ─────────────────────────────────────────────────────────────

const jsonToCsv = (items, headers) => {
  const headerRow = headers.map((h) => h.label).join(",") + "\n";
  const rows = items
    .map((item) => {
      return headers
        .map((h) => {
          let val = h.value(item);
          if (val === null || val === undefined) val = "";
          // Escape quotes and wrap in quotes if contains comma
          const stringVal = String(val).replace(/"/g, '""');
          if (stringVal.includes(",")) return `"${stringVal}"`;
          return stringVal;
        })
        .join(",");
    })
    .join("\n");
  return headerRow + rows;
};

const getUserName = (row) => {
  const userId = row.userId; // string
  const parent = row.loggedByParent; // object or null
  
  if (!parent || !parent._id) return userId; 
  if (parent._id.toString() === userId) return `${parent.firstName} ${parent.lastName}`;
  
  if (parent.childProfiles && userId.startsWith("child_")) {
    const child = parent.childProfiles.find(c => c.childId === userId);
    if (child) return `${child.name} (Child)`;
  }
  
  return userId; // Fallback
};

// ── GENERIC HANDLERS ─────────────────────────────────────────────────────

const listData = async (req, Model, populate = []) => {
  const { page, pageSize, userId, from, to } = req.query;
  const { skip, limit } = getPagination(page, pageSize);

  const filter = {};
  if (userId) filter.userId = userId;

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  let query = Model.find(filter)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  populate.forEach((p) => {
    query = query.populate(p);
  });

  const [data, total] = await Promise.all([query.lean(), Model.countDocuments(filter)]);

  return { data, total, page: parseInt(page || 1), pageSize: limit };
};

// ── SPECIFIC CONTROLLERS ─────────────────────────────────────────────────

// 1. Pain
const listPainLogs = async (req, res) => {
  try {
    const result = await listData(req, PainLog, [
      "location", 
      { path: "loggedByParent", select: "firstName lastName email" }
    ]);
    res.json({
      data: result.data.map(log => ({
        ...log,
        location: log.location?.name || "Unknown" // flatten location
      })),
      meta: { page: result.page, pageSize: result.pageSize, total: result.total }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const exportPainLogs = async (req, res) => {
  try {
    const headers = [
      { label: "Date", value: (row) => row.date ? new Date(row.date).toISOString().split('T')[0] : "" },
      { label: "User Name", value: getUserName },
      { label: "Location", value: (row) => row.location?.name || "Unknown" },
      { label: "Type", value: (row) => row.painType },
      { label: "Intensity", value: (row) => row.intensity },
      { label: "Notes", value: (row) => row.notes || "" },
    ];

    const { userId, from, to } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const data = await PainLog.find(filter)
      .sort({ date: -1 })
      .populate("location")
      .populate("loggedByParent")
      .lean();
    const csv = jsonToCsv(data, headers);
    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", `attachment; filename="pain-logs-${Date.now()}.csv"`);
    res.send(csv);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Mood
const listMoodLogs = async (req, res) => {
  try {
    const result = await listData(req, MoodLog, [
      { path: "loggedByParent", select: "firstName lastName email" }
    ]);
    res.json({ data: result.data, meta: { page: result.page, pageSize: result.pageSize, total: result.total } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const exportMoodLogs = async (req, res) => {
  try {
    const headers = [
      { label: "Date", value: (row) => row.date ? new Date(row.date).toISOString().split('T')[0] : "" },
      { label: "User Name", value: getUserName },
      { label: "Emoji", value: (row) => row.emoji },
      { label: "Intensity", value: (row) => row.intensity },
      { label: "Notes", value: (row) => row.notes || "" },
    ];
    const { userId, from, to } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const data = await MoodLog.find(filter)
      .sort({ date: -1 })
      .populate("loggedByParent")
      .lean();
    const csv = jsonToCsv(data, headers);
    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", `attachment; filename="mood-logs-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Hydration
const listHydrationLogs = async (req, res) => {
  try {
    const result = await listData(req, HydrationLog, [
      { path: "loggedByParent", select: "firstName lastName email" }
    ]);
    res.json({ data: result.data, meta: { page: result.page, pageSize: result.pageSize, total: result.total } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const exportHydrationLogs = async (req, res) => {
  try {
    const headers = [
      { label: "Date", value: (row) => row.date ? new Date(row.date).toISOString().split('T')[0] : "" },
      { label: "User Name", value: getUserName },
      { label: "Amount (ml)", value: (row) => row.amountMl },
      { label: "Type", value: (row) => row.type },
    ];
    const { userId, from, to } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    
    const data = await HydrationLog.find(filter)
      .sort({ date: -1 })
      .populate("loggedByParent")
      .lean();
    const csv = jsonToCsv(data, headers);
    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", `attachment; filename="hydration-logs-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Medication
const listMedicationLogs = async (req, res) => {
  try {
    const { page, pageSize, userId, from, to } = req.query;
    const { skip, limit } = getPagination(page, pageSize);
    const filter = {};
    if (userId) filter.userId = userId;

    if (from || to) {
      filter.dateTime = {};
      if (from) filter.dateTime.$gte = new Date(from);
      if (to) filter.dateTime.$lte = new Date(to);
    }
    
    // MedicationIntake references a Schedule via scheduleId
    const [data, total] = await Promise.all([
        MedicationIntake.find(filter)
            .sort({ dateTime: -1 })
            .skip(skip)
            .limit(limit)
            .populate("scheduleId")
            .populate({ path: "loggedByParent", select: "firstName lastName email" })
            .lean(),
        MedicationIntake.countDocuments(filter)
    ]);
    
    res.json({ 
        data: data.map(d => ({
            ...d,
            medicationName: d.scheduleId?.name || "Unknown"
        })), 
        meta: { page: parseInt(page || 1), pageSize: limit, total } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const exportMedicationLogs = async (req, res) => {
  try {
    const headers = [
      { label: "Taken At", value: (row) => row.dateTime ? new Date(row.dateTime).toLocaleString() : "" },
      { label: "User Name", value: getUserName },
      { label: "Medication", value: (row) => row.scheduleId?.name || "Unknown" },
      { label: "Status", value: (row) => row.status },
      { label: "Dosage", value: (row) => row.scheduleId?.dose || "" },
    ];
    const { userId, from, to } = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (from || to) {
      filter.dateTime = {};
      if (from) filter.dateTime.$gte = new Date(from);
      if (to) filter.dateTime.$lte = new Date(to);
    }
    const data = await MedicationIntake.find(filter)
      .sort({ dateTime: -1 })
      .populate("scheduleId")
      .populate("loggedByParent")
      .lean();
    const csv = jsonToCsv(data, headers);
    res.header("Content-Type", "text/csv");
    res.header("Content-Disposition", `attachment; filename="medication-logs-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  listPainLogs, exportPainLogs,
  listMoodLogs, exportMoodLogs,
  listHydrationLogs, exportHydrationLogs,
  listMedicationLogs, exportMedicationLogs
};
