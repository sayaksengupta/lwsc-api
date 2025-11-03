const router = require('express').Router();
const { validate } = require('../middleware/validate');
const { searchQuerySchema } = require('../validators/facilitiesValidator');
const { search } = require('../controllers/facilitiesController');

router.get('/search', validate(searchQuerySchema, 'query'), search);

module.exports = router;