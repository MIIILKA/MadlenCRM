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
        // Використовуємо $set, щоб Mongoose не ігнорував оновлення об'єкта
        await Staff.findByIdAndUpdate(
            req.user.id,
            { $set: { workHours: req.body } },
            { new: true, upsert: true }
        );
        res.json({ ok: true });
    } catch (err) {
        console.error("Save error:", err);
        res.status(500).json({ message: 'Помилка збереження' });
    }
};