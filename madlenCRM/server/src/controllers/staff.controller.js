const Staff = require("../models/Staff");
const User = require("../models/User");

// Отримати всіх майстрів
exports.getAllStaff = async (req, res) => {
    try {
        const staff = await Staff.find();
        res.status(200).json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Створити майстра (+ автоматичний акаунт юзера)
exports.createStaff = async (req, res) => {
    try {
        const { name, email, role, phone } = req.body;

        if (!phone) {
            return res.status(400).json({ message: "Номер телефону обов'язковий" });
        }

        // 1. Шукаємо або створюємо User
        // ПРИМІТКА: Ми не хешуємо пароль тут, бо в User.js тепер є pre('save')
        let user = await User.findOne({ phone: phone }); // Перевір, чи в моделі поле phone чи loginValue

        if (!user) {
            user = new User({
                name,
                phone: phone,      // використовуємо телефон як логін
                password: '111111', // модель User сама захешує це при збереженні
                role: 'master'
            });
            await user.save();
            console.log(`✅ Створено акаунт для майстра: ${name}`);
        }

        // 2. Створюємо запис у колекції Staff з ТИМ САМИМ ID
        const staffData = {
            _id: user._id,
            name,
            email,
            role,
            phone
        };

        if (req.file) {
            staffData.avatar = req.file.path;
        }

        const newStaff = new Staff(staffData);
        await newStaff.save();

        console.log(`✅ Майстра додано в список персоналу: ${name}`);
        res.status(201).json(newStaff);
    } catch (error) {
        console.error("❌ Помилка при створенні майстра:", error.message);
        res.status(400).json({ message: error.message });
    }
};

// Оновити дані майстра
exports.updateStaff = async (req, res) => {
    try {
        const updated = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Видалити майстра (і його акаунт юзера)
exports.deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (staff) {
            // Видаляємо зв'язаного юзера, щоб не лишати "хвостів"
            await User.findByIdAndDelete(staff._id);
            await Staff.findByIdAndDelete(req.params.id);
            console.log(`🗑️ Майстра та його акаунт видалено`);
        }
        res.status(200).json({ message: "Успішно видалено" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};