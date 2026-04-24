const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true }, // напр. "Топ-стиліст", "Барбер"
    specialization: { type: String }, // напр. "Стрижки та борода"
    avatar: { type: String }, // URL фото або просто перша літера
    experience: { type: String }, // напр. "5 років досвіду"
    rating: { type: Number, default: 5.0 }
}, { timestamps: true });

module.exports = mongoose.model('Staff', StaffSchema);