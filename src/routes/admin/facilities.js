const router = require('express').Router();
const { 
  listFacilities, getFacility, createFacility, 
  updateFacility, deleteFacility 
} = require('../../controllers/admin/facilityController');
const { adminAuth } = require('../../middleware/adminAuth');
const { validate } = require('../../middleware/validate');
const { createFacilitySchema } = require('../../validators/facilitiesValidator');

// All routes protected by adminAuth
router.use(adminAuth);

router.get('/', listFacilities);
router.get('/:id', getFacility);
router.post('/', validate(createFacilitySchema, 'body'), createFacility);
router.put('/:id', validate(createFacilitySchema, 'body'), updateFacility);
router.delete('/:id', deleteFacility);

module.exports = router;
