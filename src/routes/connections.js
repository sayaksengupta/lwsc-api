// routes/connections.js
const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { getActiveUserId } = require("../middleware/activeProfile");
const { validate } = require("../middleware/validate");
const {
  createSchema,
  updateSchema,
} = require("../validators/connectionsValidator");
const {
  list,
  create,
  update,
  remove,
  findFriendsOnApp,
  bulkCreate,
} = require("../controllers/connectionsController");
const rateLimit = require("express-rate-limit");

const findFriendsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Try again later.",
    },
  },
});

// MIDDLEWARE ORDER IS EVERYTHING
router.use(auth); // sets req.user (parent)
router.use(getActiveUserId); // ← sets req.activeUserId (for context only)

router.get("/", list);
router.post("/", validate(createSchema), bulkCreate);
router.patch("/:id", validate(updateSchema), update);
router.delete("/:id", remove);
router.post("/find-friends", findFriendsLimiter, findFriendsOnApp);

module.exports = router;
