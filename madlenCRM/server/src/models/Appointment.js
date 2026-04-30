const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: false },
    clientName: { type: String, default: "" },
    clientWishes: { type: String, default: ""},
    phone: { type: String, default: "" },
    comment: { type: String, default: "" },
    date: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: Number, default: 20 },
    category: { type: String, default: 'other' },
    reminderSent: { type: Boolean, default: false },
    tips: {
        type: Number,
        default: 0
    },
    dyeingDetails: {
        formula: { type: String, default: '' }, // Текстовий опис для історії
        components: [{
            name: { type: String, default: '' },
            grams: { type: Number, default: 0 }
        }],
        selectedPaintId: { type: String, default: '' },
        selectedPaintPrice: { type: Number, default: 0 },
        extraWash: { type: Boolean, default: false },
        finalPrice: { type: Number },
        grams: { type: Number },      // Загальна вага фарб
        oxid: { type: Number }        // Вага окисника
    },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);