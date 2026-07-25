const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe } = require('../controllers/pushController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/subscribe', verifyToken, subscribe);
router.post('/unsubscribe', verifyToken, unsubscribe);

module.exports = router;
