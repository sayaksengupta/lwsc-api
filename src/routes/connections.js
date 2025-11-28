const router = require("express").Router();
const { auth } = require("../middleware/auth");
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
  windowMs: 15 * 60 * 1000, // 15 min
  max: 6,
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests. Try again later.",
    },
  },
});

router.get("/", auth, list);
router.post("/", auth, validate(createSchema), bulkCreate);
router.patch("/:id", auth, validate(updateSchema), update);
router.delete("/:id", auth, remove);
router.post("/find-friends", auth, findFriendsLimiter, findFriendsOnApp);

module.exports = router;