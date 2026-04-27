const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');

// Імпортуємо мідлвари деструктуризацією (так безпечніше)
// ПЕРЕВІР: якщо в самому файлі auth.middleware.js функція називається просто "auth",
// то в дужках нижче змініть authMiddleware на auth.
const { authMiddleware, adminMiddleware, calendarAccessMiddleware } = require('../middleware/auth.middleware');

// Роути для клієнтів та загальні
router.post('/', appointmentController.createAppointment);
router.get('/slots', appointmentController.getBookedSlots);
router.get('/my', authMiddleware, appointmentController.getClientAppointments);
// Роути для майстрів
router.get('/master', authMiddleware, appointmentController.getMasterAppointments);
router.get('/staff/work-hours',  authMiddleware, appointmentController.getWorkHours);
router.post('/staff/work-hours', authMiddleware, appointmentController.saveWorkHours);

// Роути для адміна/овнера (фінанси та повний календар)
router.get('/finance/stats', authMiddleware, adminMiddleware, appointmentController.getFinanceStats);

// Замість adminMiddleware ставимо calendarAccessMiddleware
router.get('/all', authMiddleware, calendarAccessMiddleware, appointmentController.getAllAppointments);
router.patch('/:id', appointmentController.updateAppointment);

module.exports = router;