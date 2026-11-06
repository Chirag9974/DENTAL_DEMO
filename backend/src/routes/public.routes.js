import { Router } from 'express';
import { getClinic, getServices } from '../controllers/clinic.controller.js';
import { createAppointment } from '../controllers/appointments.controller.js';
import { validate, appointmentBodySchema, appointmentLimiter } from '../middleware/validation.js';
import { noStore } from '../middleware/security.js';

const router = Router();

router.get('/clinic', getClinic);
router.get('/services', getServices);

// The 201 echoes the patient's own details back, so it must never be stored.
router.post(
  '/appointments',
  appointmentLimiter,
  noStore,
  validate('body', appointmentBodySchema),
  createAppointment
);

export default router;
