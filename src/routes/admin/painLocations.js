const router = require("express").Router();
const { adminAuth } = require("../../middleware/adminAuth");
const painLocationController = require("../../controllers/painLocationController");
const { uploadIcon } = require("../../config/upload");

// All routes here require admin authentication
router.use(adminAuth);

// GET /api/v1/admin/pain-locations
router.get("/", painLocationController.adminList);

// POST /api/v1/admin/pain-locations
router.post("/", uploadIcon.single("logo"), (req, res, next) => {
  req.body.type = "pain-location";
  next();
}, painLocationController.create);

// PUT /api/v1/admin/pain-locations/:id
router.put("/:id", uploadIcon.single("logo"), (req, res, next) => {
  req.body.type = "pain-location";
  next();
}, painLocationController.update);

// DELETE /api/v1/admin/pain-locations/:id
router.delete("/:id", painLocationController.remove);

module.exports = router;
