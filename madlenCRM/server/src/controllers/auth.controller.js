const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Реєстрація нового користувача
exports.register = async (req, res) => {
    console.log("--- ПОЧАТОК РЕЄСТРАЦІЇ ---");
    console.log("Дані з фронтенду:", req.body);

    try {
        const { name, loginValue, password } = req.body;

        if (!name || !password || !loginValue) {
            return res.status(400).json({ message: "Заповніть усі поля" });
        }

        // Визначаємо, що прийшло: email чи телефон
        const isEmail = loginValue.includes('@');

        const newUser = new User({
            name,
            password, // УВАГА: Для реального проекту додай bcrypt.hashSync(password, 10)
            phone: !isEmail ? loginValue : undefined,
            email: isEmail ? loginValue : undefined,
            role: 'user' // Роль за замовчуванням
        });

        console.log("Спроба збереження юзера в БД...");
        const savedUser = await newUser.save();

        console.log("✅ ЮЗЕР УСПІШНО ЗБЕРЕЖЕНИЙ:", savedUser.name);

        // Відразу створюємо токен, щоб юзер залогінився після реєстрації
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
        if (err.code === 11000) {
            console.log("❌ Помилка: такий юзер вже існує");
            return res.status(400).json({ message: "Користувач з таким логіном вже існує" });
        }
        console.error("❌ ПОМИЛКА РЕЄСТРАЦІЇ:", err.message);
        res.status(500).json({ message: "Помилка сервера", error: err.message });
    }
};

// Логін користувача
exports.login = async (req, res) => {
    console.log("--- СПРОБА ВХОДУ ---");
    try {
        const { loginValue, password } = req.body;
        console.log("Логін:", loginValue);

        // Шукаємо або по телефону, або по пошті
        const user = await User.findOne({
            $or: [
                { phone: loginValue },
                { email: loginValue }
            ]
        });

        if (!user) {
            console.log("❌ Користувача не знайдено в базі");
            return res.status(401).json({ message: "Невірний логін або пароль" });
        }

        // Перевірка пароля (якщо без bcrypt — пряме порівняння)
        if (user.password !== password) {
            console.log("❌ Пароль не збігається для:", loginValue);
            return res.status(401).json({ message: "Невірний логін або пароль" });
        }

        console.log("✅ Логін успішний! Роль юзера:", user.role);

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
        console.error("❌ ПОМИЛКА ЛОГІНУ:", err.message);
        res.status(500).json({ message: "Помилка сервера" });
    }
};

// Перевірка токена (для ініціалізації додатку)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Помилка сервера" });
    }
};