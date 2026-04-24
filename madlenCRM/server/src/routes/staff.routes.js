const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const upload = require('../middleware/upload'); // Перевір шлях до файлу multer

// Важливо: upload.single('avatar') має бути ТУТ
router.post('/', upload.single('avatar'), staffController.createStaff);
router.put('/:id', upload.single('avatar'), staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);
router.get('/', staffController.getAllStaff);

module.exports = router;