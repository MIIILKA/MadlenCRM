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
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        // Шукаємо записи
        const appointments = await Appointment.find({
            date: { $gte: now, $lte: twoHoursLater },
            reminderSent: { $ne: true },
            status: { $ne: 'cancelled' }
        }).populate('userId');

        // ВЕСЬ ЦЕЙ БЛОК МАЄ БУТИ ТУТ
        for (const app of appointments) {
            const user = app.userId;

            if (user && user.pushSubscription) {
                const payload = JSON.stringify({
                    title: 'Madlen CRM ✂️',
                    body: `Нагадуємо, у вас запис о ${app.time}. Чекаємо на вас!`
                });

                await webpush.sendNotification(user.pushSubscription, payload);

                app.reminderSent = true;
                await app.save();

                console.log(`✅ Нагадування відправлено для: ${user.name}`);
            }
        }
    } catch (error) {
        console.error('❌ Помилка при розсилці:', error);
    }
};

module.exports = sendReminders;