const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/pushController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/subscribe', verifyToken, subscribe);

module.exports = router;
