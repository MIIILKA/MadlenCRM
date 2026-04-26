// models/Staff.js
const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    role: { type: String, required: true },
    avatar: { type: String },
    specializations: {
        type: Map,
        of: Number,
        default: {}
    },
    workHours: {
        type: Object,
        default: {
            "1": { active: true,  start: '10:00', end: '19:00' },
            "2": { active: true,  start: '10:00', end: '19:00' },
            "3": { active: true,  start: '10:00', end: '19:00' },
            "4": { active: true,  start: '10:00', end: '19:00' },
            "5": { active: true,  start: '10:00', end: '19:00' },
            "6": { active: true,  start: '10:00', end: '16:00' },
            "0": { active: false, start: '10:00', end: '14:00' }
        }
    }
}, { timestamps: true, minimize: false });

module.exports = mongoose.model('Staff', StaffSchema);