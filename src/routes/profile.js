const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { switchProfile } = require('../controllers/profileController');

router.post('/switch', auth, switchProfile);

module.exports = router;