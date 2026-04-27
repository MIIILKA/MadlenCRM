const Appointment = require('../models/Appointment');
const Staff = require('../models/Staff');
const User = require('../models/User');
const webpush = require('web-push'); // Переконайся, що бібліотека підключена
const Service = require('../models/Service'); // ТУТ БУЛА ПОМИЛКА — ДОДАЙ ЦЕЙ РЯДОК

const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
};
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
// 2. Створити новий запис (підтримує і клієнтський запис, і ручний з календаря)
exports.createAppointment = async (req, res) => {
    try {
        // Отримуємо client з тіла запиту (його пришле фронтенд)
        const { staff, service, client, clientName, phone, date, time, comment } = req.body;

        const [selectedService, staffMember] = await Promise.all([
            Service.findById(service),
            Staff.findById(staff)
        ]);

        if (!selectedService) return res.status(404).json({ message: "Послугу не знайдено" });

        // Рахуємо тривалість на основі спеціалізації майстра
        const sId = selectedService._id.toString();
        const finalDuration = Number(staffMember?.specializations?.[sId]) || Number(selectedService.duration) || 20;

        const startNew = timeToMinutes(time);
        const endNew = startNew + finalDuration;

        // Перевірка на накладки
        const existingApps = await Appointment.find({
            staff,
            date,
            status: { $ne: 'cancelled' }
        }).populate('service');

        const hasOverlap = existingApps.some(app => {
            const appStart = timeToMinutes(app.time);
            const appEnd = appStart + (Number(app.duration) || 20);
            const isOver = startNew < appEnd && endNew > startStart;

            if (isOver) {
                const name1 = (selectedService.name || "").toLowerCase();
                const name2 = (app.service?.name || "").toLowerCase();

                // Якщо хоча б одна послуга — манікюр/візаж/стрижка, накладка ЗАБОРОНЕНА
                const isStrict = /манікюр|візаж|стриж|makeup|manicure/i.test(name1) ||
                    /манікюр|візаж|стриж|makeup|manicure/i.test(name2);
                if (isStrict) return true;

                // Дозволяємо тільки якщо обидва — фарбування
                const isDye1 = /фарб|color|dye/i.test(name1);
                const isDye2 = /фарб|color|dye/i.test(name2);
                return !(isDye1 && isDye2);
            }
            return false;
        });

        if (hasOverlap) return res.status(400).json({ message: "Цей час уже зайнятий!" });

        // СТВОРЕННЯ ОБ'ЄКТА
        const newAppointment = new Appointment({
            staff,
            service,
            client: client || null,
            clientName,
            phone,
            date,
            time,
            comment,
            duration: finalDuration,
            category: selectedService.category || 'other',
            status: 'pending'
        });

        await newAppointment.save();
        res.status(201).json(newAppointment);
    } catch (error) {
        console.error("CREATE ERROR:", error);
        res.status(500).json({ message: "Помилка сервера" });
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

exports.getFinanceStats = async (req, res) => {
    try {
        const staffId = req.user.id;
        const now = new Date();

        // Отримуємо всі записи майстра, які НЕ скасовані
        const appointments = await Appointment.find({
            staff: staffId,
            status: { $ne: 'cancelled' }
        }).populate('service', 'price');
//ff
        const stats = appointments.reduce((acc, app) => {
            // Створюємо об'єкт дати запису для порівняння
            // app.date (YYYY-MM-DD) + app.time (HH:mm)
            const appointmentDate = new Date(`${app.date}T${app.time}`);

            // Якщо час запису вже в минулому — рахуємо як заробіток
            if (appointmentDate < now) {
                acc.totalEarnings += (app.service?.price || 0);
                acc.completedCount += 1;
            } else {
                // Якщо час ще не настав — це майбутній дохід
                acc.upcomingEarnings += (app.service?.price || 0);
                acc.pendingCount += 1;
            }
            return acc;
        }, { totalEarnings: 0, completedCount: 0, upcomingEarnings: 0, pendingCount: 0 });

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: "Помилка автоматичного розрахунку", error: err.message });
    }
};
// Оновлення запису (для Drag-and-Drop)
webpush.setVapidDetails(
    'mailto:your-email@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// В appointment.controller.js заміни функцію updateAppointment на цю:
exports.updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { staff, time, date } = req.body;

        const movingApp = await Appointment.findById(id).populate('service staff');
        if (!movingApp) return res.status(404).json({ message: "Запис не знайдено" });

        const sId = movingApp.service?._id?.toString();
        const movingDuration = Number(movingApp.staff?.specializations?.[sId]) || Number(movingApp.duration) || 20;

        const startNew = timeToMinutes(time);
        const endNew = startNew + movingDuration;

        // Шукаємо перетини
        const dayApps = await Appointment.find({
            staff, date, _id: { $ne: id }, status: { $ne: 'cancelled' }
        }).populate('service');

        const hasOverlap = dayApps.some(app => {
            const appSId = app.service?._id?.toString();
            // Тут важливо: беремо тривалість кожного існуючого запису
            const appDuration = Number(app.duration) || 20;
            const startExisting = timeToMinutes(app.time);
            const endExisting = startExisting + appDuration;

            const isOverlapping = startNew < endExisting && endNew > startExisting;

            if (isOverlapping) {
                const name1 = (movingApp.service?.name || "").toLowerCase();
                const name2 = (app.service?.name || "").toLowerCase();
                const isDye1 = /фарб|color|dye/i.test(name1);
                const isDye2 = /фарб|color|dye/i.test(name2);

                // Якщо обидва — фарбування, дозволяємо. В іншому випадку — ЗАБОРОНА.
                if (isDye1 && isDye2) return false;
                return true;
            }
            return false;
        });

        if (hasOverlap) {
            return res.status(400).json({ message: "Накладка! Манікюр/візаж/стрижка мають бути окремо." });
        }

        const updatedApp = await Appointment.findByIdAndUpdate(id, { staff, time, date }, { new: true })
            .populate('staff service client');

        res.status(200).json(updatedApp);
    } catch (error) {
        res.status(500).json({ message: "Помилка сервера", error: error.message });
    }
};


exports.getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('staff') // Важливо: без фільтрації полів!
            .populate({
                path: 'service',
                populate: {
                    path: 'category',
                    select: 'name color slug'
                }
            })
            .populate('client', 'name phone');

        const formatted = appointments.map(app => {
            // 1. Отримуємо ID послуги
            const sId = app.service?._id?.toString() || app.service?.toString();

            // 2. ДІСТАЄМО ЧАС МАЙСТРА
            // Важливо: перевіряємо чи існує об'єкт specializations
            const specs = app.staff?.specializations || {};
            const masterDuration = specs[sId];

            // 3. ПРІОРИТЕТ: Час майстра -> Час запису -> Час послуги -> 20
            const finalDuration = Number(masterDuration) || Number(app.duration) || Number(app.service?.duration) || 20;

            // ЛОГ ДЛЯ ТЕБЕ (дивись в консоль бекенда!)
            if (masterDuration) {
                console.log(`[OK] Майстер ${app.staff?.name} має спец. час ${masterDuration} для ${sId}`);
            }

            return {
                _id: app._id,
                staffId: app.staff?._id || null,
                staff: app.staff,
                date: app.date,
                time: app.time,
                status: app.status,
                duration: finalDuration,
                clientName: app.clientName || app.client?.name || 'Клієнт',
                phone: app.phone || app.client?.phone || '',
                comment: app.comment || '',
                serviceName: app.service?.name || '—',
                categoryName: app.service?.category?.name || '—',
                serviceId: app.service?._id || app.service,
                categoryColor: app.service?.category?.color || '#D4AF37',
                masterName: app.staff?.name || 'Майстер',
                masterRole: app.staff?.role || '',
            };
        });

        res.status(200).json(formatted);
    } catch (err) {
        console.error("ERROR IN getAllAppointments:", err);
        res.status(500).json({ message: "Помилка сервера", error: err.message });
    }
};


/* exports.getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('staff')
            .populate({
                path: 'service',
                populate: { path: 'category' } // Підтягуємо категорію всередині послуги
            });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ message: "Помилка" });
    }
};

*/