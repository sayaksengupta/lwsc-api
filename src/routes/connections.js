const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createSchema, updateSchema } = require('../validators/connectionsValidator');
const { list, create, update, remove } = require('../controllers/connectionsController');

router.get('/', auth, list);
router.post('/', auth, validate(createSchema), create);
router.patch('/:id', auth, validate(updateSchema), update);
router.delete('/:id', auth, remove);

module.exports = router;