const Staff = require("../models/Staff");
const User = require("../models/User");
const util = require('util'); // Додай цей імпорт на початку файлу

exports.createStaff = async (req, res) => {
    console.log("--- 🚀 createStaff почав роботу ---");
    try {
        let { name, email, role, phone } = req.body;
        const finalPhone = normalizePhone(phone);

        // Перевіряємо, чи прийшов файл від Multer
        if (req.file) {
            console.log("✅ Фото успішно завантажено в хмару:", req.file.path);
        } else {
            console.log("ℹ️ Створення без фото");
        }

        let user = await User.findOne({ phone: finalPhone });
        if (!user) {
            user = new User({ name, phone: finalPhone, password: '111111', role: 'master' });
            await user.save();
        }

        const staffData = {
            _id: user._id,
            name,
            email: email || "",
            role,
            phone: finalPhone,
            avatar: req.file ? req.file.path : ""
        };

        const newStaff = new Staff(staffData);
        await newStaff.save();

        console.log("✅ Працівника додано!");
        res.status(201).json(newStaff);

    } catch (error) {
        console.log("--- ❌ ПОМИЛКА В КОНТРОЛЕРІ ---");
        // Цей рядок розкриє таємницю [object Object]
        console.error(util.inspect(error, { depth: null, colors: true }));
        res.status(500).json({ message: error.message });
    }
};