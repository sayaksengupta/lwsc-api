const router = require("express").Router();
const { adminAuth } = require("../../middleware/adminAuth");
const {
  listPainLogs,
  exportPainLogs,
  listMoodLogs,
  exportMoodLogs,
  listHydrationLogs,
  exportHydrationLogs,
  listMedicationLogs,
  exportMedicationLogs,
} = require("../../controllers/admin/logDataController");

// All routes require admin auth
router.use(adminAuth);

// Pain
router.get("/pain", listPainLogs);
router.get("/pain/export", exportPainLogs);

// Mood
router.get("/mood", listMoodLogs);
router.get("/mood/export", exportMoodLogs);

// Hydration
router.get("/hydration", listHydrationLogs);
router.get("/hydration/export", exportHydrationLogs);

// Medication
router.get("/medications", listMedicationLogs);
router.get("/medications/export", exportMedicationLogs);

module.exports = router;
