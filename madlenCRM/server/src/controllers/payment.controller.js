const crypto = require('crypto');

exports.generatePaymentData = (req, res) => {
    try {
        const { amount, orderId, description } = req.body;
        const public_key = process.env.LIQPAY_PUBLIC_KEY;
        const private_key = process.env.LIQPAY_PRIVATE_KEY;

        if (!public_key || !private_key) {
            return res.status(500).json({ message: "Ключі LiqPay не знайдені в .env" });
        }

        const json_string = Buffer.from(JSON.stringify({
            public_key,
            version: 3,
            action: 'pay',
            amount: amount,
            currency: 'UAH',
            description: description,
            order_id: orderId,
            // 1. ПІСЛЯ ОПЛАТИ: Юзер повертається сюди (Netlify)
            result_url: 'https://madlencrm.netlify.app/profile',
            // 2. СИГНАЛ ПРО ОПЛАТУ: LiqPay стукає сюди (Render)
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