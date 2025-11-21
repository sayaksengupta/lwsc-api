const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { getWidgets, getRecentLogs } = require('../controllers/homeController');

router.get('/widgets', auth, getWidgets);
router.get('/recent-logs', auth, getRecentLogs);

module.exports = router;