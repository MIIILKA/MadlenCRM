const Appointment = require('../models/Appointment');

// 1. Отримати зайняті слоти (для фронтенда календаря)
exports.getBookedSlots = async (req, res) => {
    try {
        const { staffId, date } = req.query;
        const appointments = await Appointment.find({
            staff: staffId,
            date,
            status: { $ne: 'cancelled' }
        });
        const bookedSlots = appointments.map(app => app.time);
        res.json({ bookedSlots });
    } catch (err) {
        res.status(500).json({ message: "Помилка при отриманні слотів" });
    }
};

// 2. Створити новий запис
exports.createAppointment = async (req, res) => {
    try {
        const { serviceId, staffId, date, time, comment } = req.body;
        const clientId = req.user.id;

        console.log("--- СТВОРЕННЯ ЗАПИСУ ---");
        console.log(`Клієнт ID: ${clientId} -> Майстер ID: ${staffId}`);

        // Перевірка на "подвійний запис"
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
        console.log("✅ Запис успішно збережено в базі");
        res.status(201).json({ message: "Запис успішно створено", appointment });
    } catch (err) {
        console.error("❌ Помилка при збереженні запису:", err);
        res.status(500).json({ message: "Помилка сервера при створенні запису" });
    }
};

// 3. Отримати записи для МАЙСТРА (Соня бачить свій графік)
exports.getMasterAppointments = async (req, res) => {
    try {
        const myId = req.user.id;
        console.log("--- DEBUG START ---");
        console.log("Шукаємо записи для Соні з ID:", myId);

        // 1. Отримуємо ВЗАГАЛІ ВСІ записи з бази, щоб подивитись на них
        const allAppointments = await Appointment.find({});
        console.log("Всього записів у колекції appointments:", allAppointments.length);

        if (allAppointments.length > 0) {
            console.log("Приклад ID майстра з першого запису в БД:", allAppointments[0].staff.toString());
            console.log("Тип ID в БД:", typeof allAppointments[0].staff);
        }

        // 2. Реальний пошук
        const appointments = await Appointment.find({ staff: myId })
            .populate('service', 'name price duration')
            .populate('client', 'name phone')
            .sort({ date: 1, time: 1 });

        console.log("Результат пошуку для Соні:", appointments.length);
        console.log("--- DEBUG END ---");

        res.json(appointments);
    } catch (err) {
        console.error("DEBUG ERROR:", err);
        res.status(500).json({ message: "Помилка" });
    }
};
// 4. Отримати записи для КЛІЄНТА (Юзер бачить свої візити)
// ЦЬОГО У ТЕБЕ НЕ БУЛО, ТОМУ КЛІЄНТ НІЧОГО НЕ БАЧИВ
exports.getClientAppointments = async (req, res) => {
    try {
        console.log("--- ЗАПИТ ЗАПИСІВ КЛІЄНТА ---");
        console.log("ID Клієнта з токена:", req.user.id);

        const appointments = await Appointment.find({ client: req.user.id })
            .populate('service', 'name price duration')
            .populate('staff', 'name role') // Бачимо до якого майстра записані
            .sort({ date: 1, time: 1 });

        console.log(`Знайдено записів клієнта: ${appointments.length}`);
        res.json(appointments);
    } catch (err) {
        console.error("❌ Помилка БД (Client):", err.message);
        res.status(500).json({ message: "Помилка завантаження візитів" });
    }
};