const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { overviewQuerySchema } = require('../validators/dashboardValidator');
const { getOverview } = require('../controllers/dashboardController');

router.get('/overview', auth, validate(overviewQuerySchema, 'query'), getOverview);

module.exports = router;