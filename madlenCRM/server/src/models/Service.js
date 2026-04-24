const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: Number, required: true }, // в хвилинах (наприклад, 60)
    category: { type: String }, // манікюр, стрижка, тощо
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Service', ServiceSchema);