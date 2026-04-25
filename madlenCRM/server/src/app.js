const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Форсуємо завантаження .env, вказуючи шлях на рівень вище від папки src
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// 1. Мідлвари
app.use(cors({
    origin: ['https://madlencrm.netlify.app', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());

// 2. Статичні файли (для фото майстрів та інших завантажень)
// path.join(__dirname, '../uploads') правильно знайде папку uploads в корені server/
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 3. Підключення до бази даних
// Використовуємо ТІЛЬКИ змінну з .env, щоб бачити реальний стан підключення
const dbURI = process.env.MONGODB_URI || process.env.MONGO_URI;

console.log("--- Спроба підключення ---");
console.log("MONGO URI:", dbURI ? "Знайдено в .env ✅" : "НЕ ЗНАЙДЕНО (undefined) ❌");

if (!dbURI) {
    console.error('❌ ПОМИЛКА: MONGO_URI не знайдено в .env файлі. Перевірте розташування файлу .env!');
}

mongoose.connect(dbURI)
    .then(() => {
        console.log('✅ ВУАЛЯ! MONGODB ПІДКЛЮЧЕНО У ХМАРІ!');
        console.log('Назва бази:', mongoose.connection.name);
    })
    .catch(err => {
        console.error('❌ КРИТИЧНА ПОМИЛКА ПІДКЛЮЧЕННЯ:', err.message);
    });

// 4. Роути
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/services', require('./routes/services.routes'));
app.use('/api/staff', require('./routes/staff.routes'));
app.use('/api/appointments', require('./routes/appointments.routes'));
// Якщо у тебе є інші роути (analytics, inventory тощо), додавай їх тут так само:
// app.use('/api/inventory', require('./routes/inventory.routes'));

// 5. Обробка помилок (404)
app.use((req, res, next) => {
    res.status(404).json({ message: "Маршрут не знайдено (Route not found)" });
});

// 6. Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер Madlen CRM успішно залетів на порт ${PORT}`);
});

module.exports = app;