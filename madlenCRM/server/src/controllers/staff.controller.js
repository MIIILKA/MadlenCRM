const Staff = require("../models/Staff");
const User = require("../models/User");
const util = require('util'); // Для глибокого логування помилок



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

    try {
        const { name, email, role, phone } = req.body;

        // 1. Валідація вхідних даних (мінімальна)
        if (!name || !phone || !role) {
            return res.status(400).json({ message: "Ім'я, телефон та роль є обов'язковими" });
        }

        const finalPhone = normalizePhone(phone);

        // 2. Отримуємо шлях до фото.
        // multer-storage-cloudinary записує URL у req.file.path
        const avatarUrl = req.file ? req.file.path : "";
        console.log(req.file ? `✅ Фото отримано: ${avatarUrl}` : "ℹ️ Створення без фото");

        // 3. Пошук або створення користувача
        let user = await User.findOne({ phone: finalPhone });

        if (!user) {
            console.log("👤 Створюємо нового користувача для майстра...");
            user = new User({
                name,
                phone: finalPhone,
                password: '111111', // В ідеалі пароль має бути захешованим
                role: 'master'
            });
            await user.save();
        } else {
            console.log("🔍 Користувач вже існує, перевіряємо чи він не у стаффі...");

            // 4. КРИТИЧНО: Перевіряємо, чи цей користувач вже є в Staff
            // Якщо не перевірити, MongoDB видасть помилку дубліката _id
            const existingStaff = await Staff.findById(user._id);
            if (existingStaff) {
                return res.status(400).json({
                    message: "Цей номер телефону вже закріплений за майстром у базі стаффу"
                });
            }
        }

        // 5. Створення запису в колекції Staff
        const newStaff = new Staff({
            _id: user._id, // Використовуємо той самий ID, що й у User
            name,
            email: email || "",
            role,
            phone: finalPhone,
            avatar: avatarUrl
        });

        await newStaff.save();

        console.log("✅ Працівника успішно додано!");
        res.status(201).json(newStaff);

    } catch (error) {
        console.error("--- ❌ ПОМИЛКА В КОНТРОЛЕРІ CREATE ---");
        // Логуємо повну помилку в термінал для розробника
        console.error(util.inspect(error, { depth: null, colors: true }));

        // Відправляємо зрозумілу відповідь клієнту
        res.status(500).json({
            message: "Помилка сервера при створенні майстра",
            details: error.message
        });
    }
};




exports.updateStaff = async (req, res) => {
    console.log(`🛠️ [BACKEND CONTROLLER] Початок оновлення майстра ID: ${req.params.id}`);
    console.log("📥 Body:", req.body);

    try {
        const updateData = { ...req.body };

        if (req.file) {
            console.log("🆕 [BACKEND] Оновлення аватара на новий шлях:", req.file.path);
            updateData.avatar = req.file.path;
        } else {
            console.log("Keep [BACKEND] Старий аватар залишається без змін");
            delete updateData.avatar;
        }

        if (updateData.phone) {
            updateData.phone = normalizePhone(updateData.phone);
            console.log("📱 [BACKEND] Телефон після нормалізації:", updateData.phone);
        }

        const updated = await Staff.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!updated) {
            console.error("❌ [BACKEND] Майстра не знайдено в БД");
            return res.status(404).json({ message: "Майстра не знайдено" });
        }

        console.log("✅ [BACKEND] Дані в БД успішно оновлено");
        res.status(200).json(updated);
    } catch (error) {
        console.error("🔥 [BACKEND CONTROLLER ERROR]:", error);
        res.status(500).json({ message: "Server error during update", error: error.message });
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