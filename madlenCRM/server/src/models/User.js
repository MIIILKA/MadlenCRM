const mongoose = require("mongoose");
// bcrypt більше не потрібен тут, якщо хочеш бачити текст

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ["owner", "admin", "master", "receptionist", "user"],
        default: "user",
    },
}, { timestamps: true });

// МИ ВИДАЛИЛИ pre('save') – тепер пароль зберігається як є

module.exports = mongoose.model("User", userSchema);





/*
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs"); // Додай імпорт bcrypt

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ["owner", "admin", "master", "receptionist", "user"],
        default: "user",
    },
}, { timestamps: true });

// АВТОМАТИЧНЕ ХЕШУВАННЯ ПЕРЕД ЗБЕРЕЖЕННЯМ
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("User", userSchema);



 */