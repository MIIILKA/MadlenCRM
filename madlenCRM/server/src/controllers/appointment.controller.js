const Appointment = require('../models/Appointment');
const Staff = require('../models/Staff');
const User = require('../models/User');
const webpush = require('web-push'); // Переконайся, що бібліотека підключена
const Service = require('../models/Service'); // ТУТ БУЛА ПОМИЛКА — ДОДАЙ ЦЕЙ РЯДОК
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
        const { staff, service, clientName, phone, date, time, comment, duration } = req.body;

        const selectedService = await Service.findById(service);
        if (!selectedService) return res.status(404).json({ message: "Послугу не знайдено" });

        const finalDuration = duration || selectedService.duration || 20;
        const finalCategory = selectedService.category || 'other';

        const newAppointment = new Appointment({
            staff,
            service,
            clientName,
            phone,
            date,
            time,
            comment,
            duration: finalDuration,
            category: finalCategory, // Оце поле тепер збережеться правильно
            status: 'pending'
        });

        await newAppointment.save();

        // Повертаємо дані, щоб фронт відразу бачив зміни
        const populated = await Appointment.findById(newAppointment._id)
            .populate('staff service');

        res.status(201).json(populated);
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

        // 1. Знаходимо запис, який хочемо перемістити
        const movingApp = await Appointment.findById(id).populate('service');
        if (!movingApp) return res.status(404).json({ message: "Запис не знайдено" });

        // 2. Шукаємо, чи є вже хтось на цьому місці
        const existingApps = await Appointment.find({
            _id: { $ne: id }, // не враховуємо самого себе
            staff: staff,
            date: date,
            time: time,
            status: { $ne: 'cancelled' }
        }).populate('service');

        // 3. ЛОГІЧНА ПЕРЕВІРКА НАКЛАДОК
        // 3. ЛОГІЧНА ПЕРЕВІРКА НАКЛАДОК
        if (existingApps.length > 0) {
            const movingServiceName = movingApp.service?.name?.toLowerCase() || '';

            // Перевіряємо, чи це послуги, де НАКЛАДКИ ЗАБОРОНЕНІ (манікюр, візаж, стрижка)
            const isStrictService = /манікюр|manicure|візаж|makeup|стриж|cut/i.test(movingServiceName);

            if (isStrictService) {
                return res.status(400).json({ message: "Цей майстер не може прийняти двох клієнтів на цей час (манікюр/візаж)" });
            }

            // Якщо це фарбування — залишаємо твою логіку (можна паралельно)
            const isMovingDyeing = /фарб|color|малюв|dye/i.test(movingServiceName);
            const isExistingDyeing = existingApps.some(app =>
                /фарб|color|малюв|dye/i.test(app.service?.name || '')
            );

            if (!isMovingDyeing && !isExistingDyeing) {
                return res.status(400).json({ message: "Цей час вже зайнятий" });
            }
        }
        // 4. Оновлюємо
        const updatedApp = await Appointment.findByIdAndUpdate(
            id,
            { staff, time, date },
            { new: true }
        ).populate('staff service client');

        res.status(200).json(updatedApp);
    } catch (error) {
        console.error("PATCH ERROR:", error);
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