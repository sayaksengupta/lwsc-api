const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { getWidgets } = require('../controllers/homeController');

router.get('/widgets', auth, getWidgets);

module.exports = router;