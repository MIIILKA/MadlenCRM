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
        const [appointments, staffMember] = await Promise.all([
            Appointment.find({ staff: staffId, date, status: { $ne: 'cancelled' } }),
            Staff.findById(staffId)
        ]);

        // Генеруємо всі зайняті слоти з урахуванням тривалості
        const bookedSlots = [];
        appointments.forEach(app => {
            const [h, m] = app.time.split(':').map(Number);
            const start = h * 60 + m;
            const duration = Number(app.duration) || 20;
            // Блокуємо кожні 20 хв в діапазоні запису
            for (let t = start; t < start + duration; t += 20) {
                const hh = String(Math.floor(t / 60)).padStart(2, '0');
                const mm = String(t % 60).padStart(2, '0');
                bookedSlots.push(`${hh}:${mm}`);
            }
        });

        res.json({
            bookedSlots,
            workHours: staffMember?.workHours || {}
        });
    } catch (err) {
        res.status(500).json({ message: "Помилка" });
    }
};
// 2. Створити новий запис
// 2. Створити новий запис (підтримує і клієнтський запис, і ручний з календаря)
// 2. Створити новий запис (Виправлено: додано clientWishes)
exports.createAppointment = async (req, res) => {
    try {
        const {
            staff,
            service,
            client,
            clientName,
            clientWishes, // Витягуємо з запиту
            phone,
            date,
            time,
            comment,
            duration
        } = req.body;

        const [selectedService, staffMember] = await Promise.all([
            service ? Service.findById(service) : null,
            Staff.findById(staff)
        ]);

        if (!staffMember) return res.status(404).json({ message: "Майстра не знайдено" });

        const sId = selectedService?._id?.toString();
        const finalDuration = Number(duration) ||
            Number(staffMember?.specializations?.[sId]) ||
            Number(selectedService?.duration) || 60;

        const startNew = timeToMinutes(time);
        const endNew = startNew + finalDuration;

        const existingApps = await Appointment.find({
            staff,
            date,
            status: { $ne: 'cancelled' }
        }).populate('service');

        const hasOverlap = existingApps.some(app => {
            const appStart = timeToMinutes(app.time);
            const appEnd = appStart + (Number(app.duration) || 20);
            const isOver = startNew < appEnd && endNew > appStart;

            if (isOver) {
                if (!selectedService) return true;
                if (!app.service) return true;
                const name1 = (selectedService.name || "").toLowerCase();
                const name2 = (app.service.name || "").toLowerCase();
                if (/фарб|color|dye/i.test(name1) || /фарб|color|dye/i.test(name2)) return false;
                return true;
            }
            return false;
        });

        if (hasOverlap) return res.status(400).json({ message: "Накладка! Перевірте графік." });

        const newAppointment = new Appointment({
            staff,
            service: service || null,
            client: client || null,
            clientName: clientName || (service ? "Клієнт" : "ТЕХНІЧНА ПЕРЕРВА"),
            clientWishes: clientWishes || "", // Зберігаємо в базу
            phone: phone || "0000000000",
            date,
            time,
            comment: comment || "",
            duration: finalDuration,
            category: selectedService?.category || '600000000000000000000001',
            status: 'pending'
        });

        await newAppointment.save();
        res.status(201).json(newAppointment);
    } catch (error) {
        console.error("CREATE ERROR:", error);
        res.status(500).json({ message: "Помилка сервера", error: error.message });
    }
};

// 7. Отримати всі записи для календаря (Виправлено: додано clientWishes у мапінг)
exports.getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate('staff')
            .populate({
                path: 'service',
                populate: {
                    path: 'category',
                    select: 'name color slug'
                }
            })
            .populate('client', 'name phone');

        const formatted = appointments.map(app => {
            const hasService = !!app.service;
            const sId = hasService ? (app.service?._id?.toString() || app.service?.toString()) : null;
            const specs = app.staff?.specializations || {};
            const masterDuration = sId ? specs[sId] : null;

            const finalDuration = Number(app.duration) ||
                Number(masterDuration) ||
                Number(app.service?.duration) || 60;

            return {
                _id: app._id,
                staffId: app.staff?._id || null,
                staff: app.staff,
                date: app.date,
                time: app.time,
                status: app.status,
                duration: finalDuration,
                clientName: app.clientName || app.client?.name || 'Блок/Пауза',
                clientWishes: app.clientWishes || "", // Тепер прокидаємо на фронтенд
                phone: app.phone || app.client?.phone || '',
                comment: app.comment || '',
                serviceName: hasService ? app.service.name : 'ТЕХНІЧНА ПЕРЕРВА',
                categoryName: hasService ? app.service.category?.name : 'Перерва',
                serviceId: sId,
                categoryColor: hasService ? (app.service.category?.color || '#D4AF37') : '#555555',
                masterName: app.staff?.name || 'Майстер',
                masterRole: app.staff?.role || '',
                dyeingDetails: app.dyeingDetails || null
            };
        });

        res.status(200).json(formatted);
    } catch (err) {
        console.error("ERROR IN getAllAppointments:", err);
        res.status(500).json({ message: "Помилка сервера", error: err.message });
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
        const { staff, time, date, status, duration, dyeingDetails } = req.body;

        if (status && !time && !staff && !dyeingDetails) {
            const updated = await Appointment.findByIdAndUpdate(
                id,
                { $set: { status } },
                { new: true }
            );
            return res.json(updated);
        }

        const movingApp = await Appointment.findById(id).populate('service staff');
        if (!movingApp) return res.status(404).json({ message: "Запис не знайдено" });

        const sId = movingApp.service?._id?.toString();
        const movingDuration = Number(movingApp.staff?.specializations?.[sId]) || Number(duration) || Number(movingApp.duration) || 20;

        const startNew = timeToMinutes(time || movingApp.time);
        const endNew = startNew + movingDuration;

        if (time || staff || date) {
            const dayApps = await Appointment.find({
                staff: staff || movingApp.staff,
                date: date || movingApp.date,
                _id: { $ne: id },
                status: { $ne: 'cancelled' }
            }).populate('service');

            const hasOverlap = dayApps.some(app => {
                const appDuration = Number(app.duration) || 20;
                const startExisting = timeToMinutes(app.time);
                const endExisting = startExisting + appDuration;

                // 1. Час, куди ми хочемо поставити запис
                const movingTime = time || movingApp.time;

                // 2. ЖОРСТКА ЗАБОРОНА: Не можна ставити два записи на ОДНУ І ТУ САМУ хвилину початку
                if (app.time === movingTime) return true;

                // 3. ПЕРЕВІРКА ПЕРЕТИНУ (Overlap)
                const isOverlapping = startNew < endExisting && endNew > startExisting;

                if (isOverlapping) {
                    const name1 = (movingApp.service?.name || "").toLowerCase();
                    const name2 = (app.service?.name || "").toLowerCase();

                    const isDye1 = /фарб|color|dye/i.test(name1);
                    const isDye2 = /фарб|color|dye/i.test(name2);

                    // Дозволяємо перетин тільки якщо хоча б одна з послуг — фарбування
                    if (isDye1 || isDye2) return false;

                    // Дві стрижки або манікюри одночасно — блокуємо
                    return true;
                }
                return false;
            });

            if (hasOverlap) {
                return res.status(400).json({ message: "Накладка! Перевірте графік майстра." });
            }
        }

        const updatedApp = await Appointment.findByIdAndUpdate(
            id,
            {
                $set: {
                    ...(staff && { staff }),
                    ...(time && { time }),
                    ...(date && { date }),
                    ...(duration && { duration }),
                    ...(status && { status }),
                    ...(dyeingDetails && { dyeingDetails })
                }
            },
            { new: true }
        ).populate('staff service client');

        res.status(200).json(updatedApp);
    } catch (error) {
        console.error("UPDATE ERROR:", error);
        res.status(500).json({ message: "Помилка сервера", error: error.message });
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