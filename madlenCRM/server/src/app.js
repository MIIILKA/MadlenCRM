require('dotenv').config(); // МАЄ БУТИ ПЕРШИМ РЯДКОМ
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const sendReminders = require('./utils/pushReminders');
const categoryRoutes = require('./routes/category.routes');
const settingsRoutes = require('./routes/paintSetting.routes');
const paymentRoutes = require('./routes/payment.routes.js');
const app = express();
const fs = require('fs');
const aiRoutes = require('./routes/ai.routes');

const tempPath = path.join(__dirname, 'uploads/temp');
if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
}
app.use(cors({
    origin: ['http://localhost:5173', 'https://madlencrm.netlify.app'], // Додай обидва
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ДОДАЙ ЦЕЙ РЯДОК

// 3. Підключення до бази даних
const dbURI = process.env.MONGODB_URI || process.env.MONGO_URI;

mongoose.connect(dbURI)
    .then(() => {
        console.log('✅ MONGODB ПІДКЛЮЧЕНО!');

        // ЗАПУСКАЄМО ПЕРЕВІРКУ (раз на 10 хв)
        setInterval(() => {
            console.log('--- ⏰ Запуск перевірки нагадувань (кожні 5 хв)ААА ---');
            sendReminders();
        }, 5 * 60 * 1000);
    })
    .catch(err => {
        console.error('❌ ПОМИЛКА ПІДКЛЮЧЕННЯ:', err.message);
    });

// 4. Роути
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/services', require('./routes/services.routes'));
app.use('/api/staff', require('./routes/staff.routes'));
app.use('/api/appointments', require('./routes/appointments.routes'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/categories', categoryRoutes);
app.use('/api/paint-settings', require('./routes/paintSetting.routes'));
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', require('./routes/ai.routes'));


app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// 6. Запуск
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер на порту ${PORT}`);
});

module.exports = app;