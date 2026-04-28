const mongoose = require('mongoose');

const paintSettingSchema = new mongoose.Schema({
    pricing: {
        dye: { type: Number, default: 15 },
        oxid: { type: Number, default: 5 },
        supplies: { type: Number, default: 50 },
        // Динамічні норми витрат
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
        // Коефіцієнти технік
        techniqueCoef: {
            "one-tone": { type: Number, default: 1 },
            "balayage": { type: Number, default: 1.5 },
            "airtouch": { type: Number, default: 2 }
        }
    }
}, { timestamps: true });

// ВИПРАВЛЕНО: назва змінної має збігатися з тією, що вище (з маленької p)
module.exports = mongoose.model('PaintSetting', paintSettingSchema);