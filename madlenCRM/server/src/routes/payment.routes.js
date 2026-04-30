const express = require('express');
const router = express.Router();
const { generatePaymentData } = require('../controllers/payment.controller'); // переконайся, що шлях правильний
const { authMiddleware } = require('../middleware/auth.middleware');

// Саме цей шлях шукає фронтенд
router.post('/generate', authMiddleware, generatePaymentData);

module.exports = router;