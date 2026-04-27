const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const upload = require('../middleware/upload');

router.get('/', staffController.getAllStaff);
router.get('/:id', staffController.getStaffById);

// Використовуємо просто 'upload', бо всередині middleware вже прописано .single('avatar')
router.post('/', upload, staffController.createStaff);
router.put('/:id', upload, staffController.updateStaff);

router.delete('/:id', staffController.deleteStaff);

module.exports = router;