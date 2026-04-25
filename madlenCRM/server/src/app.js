const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Стандартне завантаження (на сервері Render змінні беруться автоматично)
require('dotenv').config();

const app = express();

// --- ДІАГНОСТИКА (додай це, щоб бачити помилку в логах Render) ---
console.log("CORS ORIGIN:", process.env.CLIENT_URL);

// 1. Мідлвари
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'] // Додай це для надійності
}));

app.use(express.json());

// 2. Статичні файли
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 3. Підключення до бази даних
const dbURI = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose.connect(dbURI)
    .then(() => {
        console.log('✅ MONGODB ПІДКЛЮЧЕНО!');
    })
    .catch(err => {
        console.error('❌ ПОМИЛКА ПІДКЛЮЧЕННЯ:', err.message);
    });

// 4. Роути
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/services', require('./routes/services.routes'));
app.use('/api/staff', require('./routes/staff.routes'));
app.use('/api/appointments', require('./routes/appointments.routes'));

// 5. 404
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// 6. Запуск
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер на порту ${PORT}`);
});

module.exports = app;