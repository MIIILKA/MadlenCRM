const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const multer = require('multer');

const upload = multer({ dest: 'uploads/temp/' });

// Залишаємо тільки цей роут
router.post('/analyze', upload.single('image'), aiController.getBeautyAdvice);

module.exports = router;