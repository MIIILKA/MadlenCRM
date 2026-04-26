const mongoose = require('mongoose'); // ОЦЕЙ РЯДОК МАЄ БУТИ ПЕРШИМ

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true },
    // ЗАМІСТЬ ENUM СТАВИМО ПОСИЛАННЯ НА МОДЕЛЬ CATEGORY
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    description: { type: String }
});

module.exports = mongoose.model('Service', serviceSchema);