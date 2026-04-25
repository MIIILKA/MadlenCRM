const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const appointmentController = require('../controllers/appointment.controller'); // ІМПОРТУЄМО ВЕСЬ КОНТРОЛЕР

// Створення запису (тільки для залогінених)
router.post('/', auth, appointmentController.createAppointment);

// Отримання зайнятих слотів (публічно або для залогінених)
router.get('/slots', appointmentController.getBookedSlots);
router.get('/staff/work-hours',  auth, appointmentController.getWorkHours);
router.post('/staff/work-hours', auth, appointmentController.saveWorkHours);
// Отримання графіку для МАЙСТРА
router.get('/master', auth, appointmentController.getMasterAppointments);
router.get('/my', auth, appointmentController.getClientAppointments);
module.exports = router;