const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authController = require("../controllers/auth.controller");

// Імпортуємо конкретну функцію через деструктуризацію
// ПЕРЕВІР: у файлі auth.middleware.js функція повинна називатися authMiddleware
const { authMiddleware } = require('../middleware/auth.middleware');

// Логін та реєстрація
router.post("/login", authController.login);
router.post("/register", authController.register);

// Маршрут для збереження підписки на Push-сповіщення
router.post('/subscribe', authMiddleware, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            pushSubscription: req.body
        });
        res.status(200).json({ message: 'Підписку збережено! ✅' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Маршрут для відписки
router.post('/unsubscribe', authMiddleware, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { pushSubscription: null });
        res.status(200).json({ message: 'Підписку видалено з бази 🗑️' });
    } catch (err) {
        res.status(500).json({ error: 'Не вдалося відписатися' });
    }
});

module.exports = router;