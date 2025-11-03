const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createSchema, updateSchema, listQuerySchema } = require('../validators/calendarValidator');
const { listEvents, createEvent, updateEvent, deleteEvent, getDay } = require('../controllers/calendarController');

router.get('/events', auth, validate(listQuerySchema, 'query'), listEvents);
router.post('/events', auth, validate(createSchema), createEvent);
router.patch('/events/:id', auth, validate(updateSchema), updateEvent);
router.delete('/events/:id', auth, deleteEvent);
router.get('/day/:date', auth, getDay);

module.exports = router;