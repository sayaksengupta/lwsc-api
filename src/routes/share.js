const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { sharePainSchema, shareMoodSchema } = require('../validators/shareValidator');
const { sharePain, shareMood } = require('../controllers/shareController');

router.post('/pain', auth, validate(sharePainSchema), sharePain);
router.post('/mood', auth, validate(shareMoodSchema), shareMood);

module.exports = router;