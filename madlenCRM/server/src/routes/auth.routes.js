const express = require("express");
const User = require("../models/User");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const auth = require("../middleware/auth.middleware"); // ОБОВ'ЯЗКОВО ДОДАЙ ЦЕЙ ІМПОРТ
const multer = require("multer");
const authMiddleware = require('../middleware/auth.middleware');


router.post("/login", authController.login);
router.post("/register", authController.register);

// Маршрут для збереження підписки на Push-сповіщення
router.post('/subscribe', auth, async (req, res) => {
    try {
        // req.user.id з'являється завдяки мідлварі auth
        await User.findByIdAndUpdate(req.user.id, {
            pushSubscription: req.body
        });
        res.status(200).json({ message: 'Підписку збережено!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Маршрут для ПІДПИСКИ (в тебе вже має бути щось схоже)
router.post('/subscribe', authMiddleware, async (req, res) => {
    try {
        const subscription = req.body;
        await User.findByIdAndUpdate(req.user.id, { pushSubscription: subscription });
        res.status(200).json({ message: 'Підписку збережено ✅' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ОСЬ ЦЕ Я ЗАБУВ! ДОДАВАЙ СЮДИ: ---
router.post('/unsubscribe', authMiddleware, async (req, res) => {
    try {
        // Просто зануляємо поле в базі для цього юзера
        await User.findByIdAndUpdate(req.user.id, { pushSubscription: null });
        res.status(200).json({ message: 'Підписку видалено з бази 🗑️' });
    } catch (err) {
        res.status(500).json({ error: 'Не вдалося відписатися' });
    }
});

module.exports = router;