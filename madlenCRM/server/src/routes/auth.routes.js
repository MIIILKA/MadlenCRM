const express = require("express");
const User = require("../models/User");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const auth = require("../middleware/auth.middleware"); // ОБОВ'ЯЗКОВО ДОДАЙ ЦЕЙ ІМПОРТ

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

module.exports = router;