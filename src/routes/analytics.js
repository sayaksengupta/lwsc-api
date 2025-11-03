const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { comparisonSchema, correlationsSchema } = require('../validators/analyticsValidator');
const { comparison, correlations } = require('../controllers/analyticsController');

router.get('/comparison', auth, validate(comparisonSchema, 'query'), comparison);
router.get('/correlations', auth, validate(correlationsSchema, 'query'), correlations);

module.exports = router;