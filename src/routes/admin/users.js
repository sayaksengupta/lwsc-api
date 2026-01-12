const router = require("express").Router();
const { adminAuth } = require("../../middleware/adminAuth");
const {
  listUsers,
  getUser,
  deleteUser,
} = require("../../controllers/admin/userController");

// All routes require admin auth
router.use(adminAuth);

router.get("/", listUsers);
router.get("/:id", getUser);
router.delete("/:id", deleteUser);

module.exports = router;
