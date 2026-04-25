const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, required: true },
    specialization: { type: String },
    avatar: { type: String },
    experience: { type: String },
    rating: { type: Number, default: 5.0 },
    // Міняємо Map на Object для стабільності
    workHours: {
        type: Object,
        default: {
            "1": { active: true,  start: '09:00', end: '18:00' },
            "2": { active: true,  start: '09:00', end: '18:00' },
            "3": { active: true,  start: '09:00', end: '18:00' },
            "4": { active: true,  start: '09:00', end: '18:00' },
            "5": { active: true,  start: '09:00', end: '18:00' },
            "6": { active: false, start: '10:00', end: '15:00' },
            "0": { active: false, start: '10:00', end: '14:00' }
        }
    }
}, { timestamps: true, minimize: false }); // minimize: false не дає Mongoose видаляти порожні об'єкти

module.exports = mongoose.model('Staff', StaffSchema);