const Appointment = require('../models/Appointment');
const Staff = require('../models/Staff');

// 1. Отримати зайняті слоти та робочий графік
exports.getBookedSlots = async (req, res) => {
    try {
        const { staffId, date } = req.query;

        // Використовуємо Promise.all для швидкості
        const [appointments, staffMember] = await Promise.all([
            Appointment.find({ staff: staffId, date, status: { $ne: 'cancelled' } }),
            Staff.findById(staffId)
        ]);

        if (!staffMember) {
            return res.status(404).json({ message: "Майстра не знайдено" });
        }

        const hours = staffMember.workHours || {};
        // Визначаємо день тижня (0-6)
        const dayOfWeek = new Date(date).getDay().toString();
        const workingDay = hours[dayOfWeek] || { active: false };

        res.json({
            bookedSlots: appointments.map(app => app.time),
            workHours: hours,
            workingDay: workingDay
        });
    } catch (err) {
        console.error("Помилка getBookedSlots:", err);
        res.status(500).json({ message: "Помилка при отриманні слотів" });
    }
};

// 2. Створити новий запис
exports.createAppointment = async (req, res) => {
    try {
        const { serviceId, staffId, date, time, comment } = req.body;
        const clientId = req.user.id;

        const existing = await Appointment.findOne({
            staff: staffId,
            date,
            time,
            status: { $ne: 'cancelled' }
        });

        if (existing) {
            return res.status(400).json({ message: "Цей час вже зайнятий" });
        }

        const appointment = new Appointment({
            client: clientId,
            staff: staffId,
            service: serviceId,
            date,
            time,
            comment
        });

        await appointment.save();
        res.status(201).json({ message: "Запис створено", appointment });
    } catch (err) {
        res.status(500).json({ message: "Помилка сервера при створенні запису" });
    }
};

// 3. Отримати записи для майстра
exports.getMasterAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ staff: req.user.id })
            .populate('service', 'name price duration')
            .populate('client', 'name phone')
            .sort({ date: 1, time: 1 });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: "Помилка завантаження графіку" });
    }
};

// 4. Отримати записи для клієнта
exports.getClientAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ client: req.user.id })
            .populate('service', 'name price duration')
            .populate('staff', 'name role')
            .sort({ date: 1, time: 1 });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: "Помилка завантаження візитів" });
    }
};

// 5. Робочі години: Отримати
exports.getWorkHours = async (req, res) => {
    try {
        const staff = await Staff.findById(req.user.id);
        res.json(staff.workHours || {});
    } catch {
        res.status(500).json({ message: 'Помилка' });
    }
};

// 6. Робочі години: Зберегти
exports.saveWorkHours = async (req, res) => {
    try {
        const staffId = req.user.id;
        const newHours = req.body;

        console.log(`📥 Отримано нові години для майстра ${staffId}:`, newHours);

        // 1. Знаходимо майстра
        const staffMember = await Staff.findById(staffId);

        if (!staffMember) {
            return res.status(404).json({ message: 'Майстра не знайдено' });
        }

        // 2. Перезаписуємо об'єкт годин
        staffMember.workHours = newHours;

        // 3. ВАЖЛИВО: Помічаємо поле як змінене (для типу Object це обов'язково)
        staffMember.markModified('workHours');

        // 4. Зберігаємо
        await staffMember.save();

        console.log("✅ Години успішно оновлені в БД");
        res.json({ ok: true });
    } catch (err) {
        console.error("❌ Помилка при збереженні годин:", err);
        res.status(500).json({ message: 'Помилка збереження' });
    }
};