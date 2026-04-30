const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const multer = require('multer');
const path = require('path');

// Тимчасове сховище
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/temp/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage });

router.post('/analyze', upload.single('image'), aiController.getBeautyAdvice);

module.exports = router;