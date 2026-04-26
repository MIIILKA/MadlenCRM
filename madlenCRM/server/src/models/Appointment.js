const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    clientName: { type: String, default: "" },
    phone: { type: String, default: "" },
    comment: { type: String, default: "" },
    date: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: Number, default: 20 },
    category: { type: String, default: 'other' }, // Додай це для кольорів!
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    }
}, { timestamps: true });

// Експортуємо МОДЕЛЬ (один раз і чисто)
module.exports = mongoose.model('Appointment', appointmentSchema);


/* const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    // client тепер необов'язковий для швидкого запису
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },

    // Поля для запису вручну
    clientName: { type: String, default: "" },
    phone: { type: String, default: "" },
    comment: { type: String, default: "" },
    duration: { type: Number, default: 20 },
    date: { type: String, required: true },
    time: { type: String, required: true },
    reminderSent: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    }
}, { timestamps: true });

// Оновлюємо унікальний індекс
appointmentSchema.index({ staff: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

*/