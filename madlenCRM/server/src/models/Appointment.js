const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    date: { type: String, required: true }, // Формат "YYYY-MM-DD"
    time: { type: String, required: true }, // Формат "HH:mm"
    reminderSent: { type: Boolean, default: false },
    comment: { type: String },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    }
}, { timestamps: true });

// Унікальний індекс, щоб не було двох записів до одного майстра на один час
appointmentSchema.index({ staff: 1, date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);