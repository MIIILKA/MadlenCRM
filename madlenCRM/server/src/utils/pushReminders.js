const webpush = require('web-push');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Це завантажить змінні, якщо вони у файлі, але не завадить на Render
require('dotenv').config();

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:balyuk@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
    console.log("✅ VAPID Keys configured successfully");
} else {
    console.warn("⚠️ VAPID Keys are missing. Push notifications won't work.");
}