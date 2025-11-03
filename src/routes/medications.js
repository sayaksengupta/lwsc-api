const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const medicationValidator = require('../validators/medicationValidator');
const {
  listSchedules, createSchedule, updateSchedule, deleteSchedule,
  listIntakes, createIntake, history, adherence
} = require('../controllers/medicationsController');

router.get('/', auth, listSchedules);
router.post('/', auth, validate(medicationValidator.createSchema), createSchedule);
router.patch('/:id', auth, validate(medicationValidator.updateSchema), updateSchedule);
router.delete('/:id', auth, deleteSchedule);

router.get('/:id/intakes', auth, validate(medicationValidator.intakeQuerySchema, 'query'), listIntakes);
router.post('/:id/intakes', auth, validate(medicationValidator.intakeCreateSchema), createIntake);

router.get('/history', auth, validate(medicationValidator.dateRangeSchema, 'query'), history);
router.get('/adherence', auth, validate(medicationValidator.dateRangeSchema, 'query'), adherence);

module.exports = router;