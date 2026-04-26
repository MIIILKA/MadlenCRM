const Staff = require("../models/Staff");
const User = require("../models/User");
const util = require('util'); // Додано для util.inspect

// Нормалізація номера
const normalizePhone = (phone) => {
    if (!phone) return phone;
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10 && cleaned.startsWith('0')) return `+38${cleaned}`;
    if (cleaned.length === 12 && cleaned.startsWith('380')) return `+${cleaned}`;
    if (cleaned.length === 9) return `+380${cleaned}`;
    return cleaned.length >= 12 ? `+${cleaned}` : phone;
};

exports.getAllStaff = async (req, res) => {
    try {
        const staff = await Staff.find();
        res.status(200).json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// НОВИЙ МЕТОД: Отримання одного майстра за ID (виправляє помилку 404 на фронтенді)
exports.getStaffById = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ message: "Майстра не знайдено" });
        }
        res.status(200).json(staff);
    } catch (error) {
        console.error("❌ ПОМИЛКА ОТРИМАННЯ МАЙСТРА:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createStaff = async (req, res) => {
    console.log("--- 🚀 createStaff почав роботу ---");
    console.log("--- 🏁 Спроба створення ---");
    console.log("Отримані дані:", req.body);
    console.log("Файл:", req.file ? "✅ OK" : "❌ Порожньо");

    try {
        let {name, email, role, phone} = req.body;
        const finalPhone = normalizePhone(phone);

        if (req.file) {
            console.log("✅ Фото успішно завантажено в хмару:", req.file.path);
        } else {
            console.log("ℹ️ Створення без фото");
        }

        let user = await User.findOne({phone: finalPhone});
        if (!user) {
            user = new User({name, phone: finalPhone, password: '111111', role: 'master'});
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
        console.error(util.inspect(error, {depth: null, colors: true}));
        res.status(500).json({message: error.message});
    }
};

exports.updateStaff = async (req, res) => {
    try {
        // Якщо прийшов новий файл через Multer (Cloudinary)
        if (req.file) {
            req.body.avatar = req.file.path;
        }

        if (req.body.phone) {
            req.body.phone = normalizePhone(req.body.phone);
        }

        // Обробка спеціалізацій, якщо вони прийшли як рядок (через FormData)
        if (req.body.specializations && typeof req.body.specializations === 'string') {
            try {
                req.body.specializations = JSON.parse(req.body.specializations);
            } catch (e) {
                console.error("Помилка парсингу спеціалізацій");
            }
        }

        const updated = await Staff.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        if (!updated) return res.status(404).json({ message: "Майстра не знайдено" });

        res.status(200).json(updated);
    } catch (error) {
        console.error("❌ ПОМИЛКА ОНОВЛЕННЯ:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (staff) {
            await User.findByIdAndDelete(staff._id);
            await Staff.findByIdAndDelete(req.params.id);
        }
        res.status(200).json({ message: "Успішно видалено" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getStaffById = async (req, res) => {
    try {
        const member = await Staff.findById(req.params.id);
        if (!member) {
            // Якщо не знайшли в Staff, не кидаємо помилку 500, а даємо 404
            return res.status(404).json({ message: "Співробітника з таким ID не знайдено в базі" });
        }
        res.json(member);
    } catch (err) {
        res.status(500).json({ message: "Помилка сервера", error: err.message });
    }
};