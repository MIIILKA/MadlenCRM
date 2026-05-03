const crypto = require('crypto');
const Appointment = require('../models/Appointment'); // Переконайся, що шлях до моделі правильний

exports.generatePaymentData = async (req, res) => {
    try {
        const { amount, orderId, description, tips } = req.body;
        const public_key = process.env.LIQPAY_PUBLIC_KEY;
        const private_key = process.env.LIQPAY_PRIVATE_KEY;

        if (!public_key || !private_key) {
            return res.status(500).json({ message: "Ключі LiqPay не знайдені в .env" });
        }

        // ЗБЕРІГАЄМО В БАЗУ: тепер ти бачитимеш чайові в MongoDB
        if (tips !== undefined) {
            await Appointment.findByIdAndUpdate(orderId, {
                tips: Number(tips)
            });
        }

        const json_string = Buffer.from(JSON.stringify({
            public_key,
            version: 3,
            action: 'pay',
            amount: amount,
            currency: 'UAH',
            description: description,
            order_id: `${orderId}_${Date.now()}`, // Унікальний ID для LiqPay
            result_url: 'https://madlencrm.netlify.app/profile',
            server_url: 'https://madlencrm-backend.onrender.com/api/payments/callback'
        })).toString('base64');

        const signature = crypto
            .createHash('sha1')
            .update(private_key + json_string + private_key)
            .digest('base64');

        res.json({ data: json_string, signature });
    } catch (error) {
        res.status(500).json({ message: "Помилка сервера", error: error.message });
    }
};

// src/controllers/payment.controller.js

exports.liqpayCallback = async (req, res) => {
    const { data, signature } = req.body;
    const private_key = process.env.LIQPAY_PRIVATE_KEY;

    // Перевірка підпису (щоб ніхто не підробив оплату)
    const sign = crypto
        .createHash('sha1')
        .update(private_key + data + private_key)
        .digest('base64');

    if (sign !== signature) {
        return res.status(400).send("Fake signature");
    }

    // Декодуємо дані
    const paymentData = JSON.parse(Buffer.from(data, 'base64').toString());

    // Отримуємо чистий ID (відрізаємо мітку часу Date.now())
    const appointmentId = paymentData.order_id.split('_')[0];

    if (paymentData.status === 'success' || paymentData.status === 'sandbox') {
        try {
            await Appointment.findByIdAndUpdate(appointmentId, {
                status: 'confirmed', // Або додай статус 'paid'
                comment: (appointmentId.comment || "") + " [ОПЛАЧЕНО ОНЛАЙН]"
            });
            console.log(`✅ Запис ${appointmentId} оплачено успішно!`);
        } catch (err) {
            console.error("Помилка оновлення статусу:", err);
        }
    }

    res.sendStatus(200); // Обов'язково відповідаємо LiqPay
};