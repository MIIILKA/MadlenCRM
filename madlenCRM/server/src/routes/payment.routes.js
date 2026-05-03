const express = require('express');
const router = express.Router();
const { generatePaymentData,liqpayCallback } = require('../controllers/payment.controller'); // переконайся, що шлях правильний
const { authMiddleware } = require('../middleware/auth.middleware');

// Саме цей шлях шукає фронтенд
router.post('/generate', authMiddleware, generatePaymentData);
router.post('/callback', liqpayCallback);

module.exports = router;
