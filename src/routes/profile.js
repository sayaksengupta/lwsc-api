const router = require("express").Router();
const { auth } = require("../middleware/auth");
const {
  switchProfile,
  getActiveProfile,
  listProfiles,
} = require("../controllers/profileController");

router.get("/active", auth, getActiveProfile);
router.get("/list", auth, listProfiles);
router.post("/switch", auth, switchProfile);

module.exports = router;
