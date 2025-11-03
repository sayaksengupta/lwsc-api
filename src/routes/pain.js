const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  createSchema,
  updateSchema,
  listQuerySchema,
  statsQuerySchema
} = require('../validators/painValidator');
const {
  list,
  create,
  update,
  remove,
  stats
} = require('../controllers/painController');

// GET /pain/logs
router.get('/logs', auth, validate(listQuerySchema, 'query'), list);

// POST /pain/logs
router.post('/logs', auth, validate(createSchema), create);

// PATCH /pain/logs/:id
router.patch('/logs/:id', auth, validate(updateSchema), update);

// DELETE /pain/logs/:id
router.delete('/logs/:id', auth, remove);

// GET /pain/stats
router.get('/stats', auth, validate(statsQuerySchema, 'query'), stats);

module.exports = router;