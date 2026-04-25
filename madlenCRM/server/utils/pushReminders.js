const webpush = require('web-push');
const Appointment = require('../models/Appointment');

const sendReminders = async () => {
    try {
        const now = new Date();
        // Рахуємо час через 2 години від зараз
        const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        // Форматуємо дату для пошуку (YYYY-MM-DD)
        const dateStr = now.toISOString().split('T')[0];

        // Шукаємо записи:
        // 1. На сьогодні
        // 2. Які не скасовані
        // 3. Яким ще НЕ відправляли нагадування
        const appointments = await Appointment.find({
            date: dateStr,
            status: { $ne: 'cancelled' },
            reminderSent: { $ne: true }
        }).populate('client'); // Важливо, щоб витягнути pushSubscription з юзера

        for (const app of appointments) {
            // Створюємо об'єкт дати/часу запису
            const appDateTime = new Date(`${app.date}T${app.time}`);

            // Якщо до запису залишилося 2 години або трохи менше (але не в минулому)
            if (appDateTime <= twoHoursLater && appDateTime > now) {

                if (app.client && app.client.pushSubscription) {
                    const payload = JSON.stringify({
                        title: 'Madlen CRM ✂️',
                        body: `Нагадуємо, у вас запис о ${app.time}. Чекаємо на вас!`
                    });

                    try {
                        await webpush.sendNotification(app.client.pushSubscription, payload);
                        console.log(`✅ Нагадування надіслано клієнту: ${app.client.name}`);
                    } catch (pushErr) {
                        console.error(`❌ Не вдалося надіслати push для ${app.client.name}:`, pushErr.message);
                    }
                }

                // В будь-якому випадку ставимо мітку, що ми "спробували" або надіслали
                app.reminderSent = true;
                await app.save();
            }
        }
    } catch (err) {
        console.error('Критична помилка в циклі нагадувань:', err);
    }
};

module.exports = sendReminders;