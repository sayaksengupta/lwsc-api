const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { redeemSchema, listQuerySchema } = require('../validators/rewardsValidator');
const { getBalance, listTransactions, redeem } = require('../controllers/rewardsController');

router.get('/coins/balance', auth, getBalance);
router.get('/coins/transactions', auth, validate(listQuerySchema, 'query'), listTransactions);
router.post('/coins/redeem', auth, validate(redeemSchema), redeem);

module.exports = router;