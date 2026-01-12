const router = require("express").Router();
const { adminAuth } = require("../../middleware/adminAuth");
const { getDashboardStats } = require("../../controllers/admin/dashboardController");

// All routes require admin auth
router.use(adminAuth);

router.get("/stats", getDashboardStats);

module.exports = router;
