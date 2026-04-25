const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const appointmentController = require('../controllers/appointment.controller');

router.post('/', auth, appointmentController.createAppointment);

// --- ОСЬ ЦЕЙ РЯДОК ТРЕБА ДОДАТИ ---
router.get('/finance/stats', auth, appointmentController.getFinanceStats);
// --------------------------------

router.get('/slots', appointmentController.getBookedSlots);
router.get('/staff/work-hours',  auth, appointmentController.getWorkHours);
router.post('/staff/work-hours', auth, appointmentController.saveWorkHours);
router.get('/master', auth, appointmentController.getMasterAppointments);
router.get('/my', auth, appointmentController.getClientAppointments);

module.exports = router;