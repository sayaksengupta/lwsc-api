const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createSchema, updateSchema, listQuerySchema, statsQuerySchema
} = require('../validators/moodValidator');
const { list, create, update, remove, stats } = require('../controllers/moodController');

router.get('/logs', auth, validate(listQuerySchema, 'query'), list);
router.post('/logs', auth, validate(createSchema), create);
router.patch('/logs/:id', auth, validate(updateSchema), update);
router.delete('/logs/:id', auth, remove);
router.get('/stats', auth, validate(statsQuerySchema, 'query'), stats);

module.exports = router;