const express = require('express');
const router = express.Router();
const controller = require('../controllers/paintSetting.controller');
const auth = require('../middleware/auth.middleware'); // ПЕРЕВІР НАЗВУ ФАЙЛУ ТУТ

// Переконайся, що назви функцій ПІСЛЯ "controller." збігаються з exports у контролері
router.get('/', controller.getSettings);
router.put('/', controller.updateSettings);

module.exports = router;