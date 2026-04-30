const mongoose = require('mongoose');

const paintSettingSchema = new mongoose.Schema({
    pricing: {
        // Базова ціна (залишаємо як резервну)
        dye: { type: Number, default: 15 },
        oxid: { type: Number, default: 5 },
        supplies: { type: Number, default: 50 },

        // СПИСОК ВИДІВ ФАРБ (Нове: для адмінки)
        paints: [
            {
                name: { type: String, required: true },
                price: { type: Number, required: true },
                brand: { type: String } // опціонально
            }
        ],

        // Динамічні норми витрат (грами)
        baseGrams: {
            short: { type: Number, default: 40 },
            medium: { type: Number, default: 60 },
            long: { type: Number, default: 80 }
        },

        // Коефіцієнти густоти
        densityCoef: {
            low: { type: Number, default: 0.8 },
            medium: { type: Number, default: 1 },
            high: { type: Number, default: 1.3 }
        },

        // Коефіцієнти складності технік
        techniqueCoef: {
            "one-tone": { type: Number, default: 1 },
            "balayage": { type: Number, default: 1.5 },
            "airtouch": { type: Number, default: 2 }
        }
    }
}, {
    timestamps: true
});

// Експортуємо модель
module.exports = mongoose.model('PaintSetting', paintSettingSchema);