const webpush = require('web-push');
const path = require('path');
const Appointment = require('../models/Appointment'); // ПЕРЕВІР: якщо файл Appointment.js, то шлях такий
const User = require('../models/User');               // ПЕРЕВІР: якщо файл User.js
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
// Налаштування ключів
webpush.setVapidDetails(
    process.env.VAPID_EMAIL, // Має бути 'mailto:example@gmail.com'
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const sendReminders = async () => {
    try {
        const now = new Date();
        // Враховуємо часовий пояс Львова
        const kyivNow = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Kyiv"}));

        // Цільовий час: зараз + 10 хвилин
        const targetTime = new Date(kyivNow.getTime() + 10 * 60 * 1000);

        const dateStr = kyivNow.toISOString().split('T')[0];
        const h = String(targetTime.getHours()).padStart(2, '0');
        const m = String(targetTime.getMinutes()).padStart(2, '0');
        const timeStr = `${h}:${m}`;

        console.log(`🔍 Шукаємо записи на сьогодні (${dateStr}) о ${timeStr}`);

        const appointments = await Appointment.find({
            date: dateStr,
            time: timeStr,
            reminderSent: { $ne: true }, // Щоб не слати повторно
            status: { $in: ['confirmed', 'pending'] } // Тепер шукає і підтверджені, і нові

        }).populate('client'); // Важливо: саме 'client'

        for (const app of appointments) {
            if (app.client?.pushSubscription) {
                const payload = JSON.stringify({
                    title: 'Madlen CRM ✂️',
                    body: `Нагадуємо, у вас запис за 10 хвилин (${app.time}). Чекаємо на вас!`
                });

                await webpush.sendNotification(app.client.pushSubscription, payload);

                app.reminderSent = true;
                await app.save();
                console.log(`✅ Пуш надіслано для: ${app.clientName}`);
            }
        }
    } catch (error) {
        console.error('❌ Помилка розсилки:', error);
    }
};


module.exports = sendReminders;