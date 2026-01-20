const router = require('express').Router();
const { validate } = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { searchQuerySchema, createFacilitySchema } = require('../validators/facilitiesValidator');
const { search, create } = require('../controllers/facilitiesController');

// App users can search without authentication
router.get('/search', validate(searchQuerySchema, 'query'), search);

// App users must be logged in to suggest/add a facility
router.post('/', auth, validate(createFacilitySchema, 'body'), create);

module.exports = router;