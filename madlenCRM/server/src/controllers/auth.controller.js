const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// --- ДОПОМІЖНА ФУНКЦІЯ ДЛЯ НОРМАЛІЗАЦІЇ НОМЕРА ---
const normalizePhone = (phone) => {
    if (!phone) return phone;
    // Видаляємо все, крім цифр
    let cleaned = phone.replace(/\D/g, '');

    // Якщо номер починається з 0 (наприклад 068...) — додаємо 38
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
        return `+38${cleaned}`;
    }
    // Якщо номер вже повний (380...) — просто додаємо плюс
    if (cleaned.length === 12 && cleaned.startsWith('380')) {
        return `+${cleaned}`;
    }
    // Якщо номер без 38 (наприклад 68...) — додаємо +380
    if (cleaned.length === 9) {
        return `+380${cleaned}`;
    }

    // Якщо нічого не підійшло, але цифр 12, просто ставимо +
    return cleaned.length >= 12 ? `+${cleaned}` : phone;
};

// Реєстрація нового користувача
exports.register = async (req, res) => {
    try {
        let { name, loginValue, password } = req.body;

        if (!name || !password || !loginValue) {
            return res.status(400).json({ message: "Заповніть усі поля" });
        }

        const isEmail = loginValue.includes('@');

        // Нормалізуємо, якщо це телефон
        const finalLogin = isEmail ? loginValue : normalizePhone(loginValue);

        const newUser = new User({
            name,
            password,
            phone: !isEmail ? finalLogin : undefined,
            email: isEmail ? finalLogin : undefined,
            role: 'user'
        });

        const savedUser = await newUser.save();

        const token = jwt.sign(
            { id: savedUser._id, role: savedUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                role: savedUser.role,
                phone: savedUser.phone,
                email: savedUser.email
            }
        });

    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ message: "Користувач вже існує" });
        res.status(500).json({ message: "Помилка сервера", error: err.message });
    }
};

// Логін користувача
exports.login = async (req, res) => {
    try {
        let { loginValue, password } = req.body;

        const isEmail = loginValue.includes('@');
        // Обов'язково нормалізуємо введений номер перед пошуком!
        const searchLogin = isEmail ? loginValue : normalizePhone(loginValue);

        const user = await User.findOne({
            $or: [
                { phone: searchLogin },
                { email: searchLogin }
            ]
        });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Невірний логін або пароль" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                phone: user.phone,
                email: user.email
            }
        });

    } catch (err) {
        res.status(500).json({ message: "Помилка сервера" });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Помилка сервера" });
    }
};