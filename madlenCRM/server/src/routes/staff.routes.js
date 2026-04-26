const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const upload = require('../middleware/upload'); // Перевір шлях до файлу multer

// Важливо: upload має бути ТУТ для постів та путів
router.get('/', staffController.getAllStaff);

// ДОДАНО: Роут для отримання одного майстра (щоб не було 404 у MasterDashboard)
router.get('/:id', staffController.getStaffById);

router.post('/', upload, staffController.createStaff);
router.put('/:id', upload, staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;