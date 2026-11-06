import { Router } from 'express';
import {
  login,
  logout,
  me,
  listAppointments,
  getAppointment,
  patchAppointment,
} from '../controllers/admin.controller.js';
import { requireAdmin } from '../middleware/auth.js';
import { noStore, requireTrustedOrigin } from '../middleware/security.js';
import {
  validate,
  validateObjectId,
  loginBodySchema,
  statusPatchSchema,
  adminListQuerySchema,
  loginLimiter,
  loginEmailLimiter,
} from '../middleware/validation.js';

const router = Router();

// No admin response — not even an error or a login body — may be cached.
router.use(noStore);

router.post(
  '/login',
  requireTrustedOrigin,
  loginLimiter,
  validate('body', loginBodySchema),
  loginEmailLimiter,
  login
);

// Everything below requires a valid admin session/token.
router.use(requireAdmin);
// Applies to POST/PATCH only; blocks forged cross-site cookie requests.
router.use(requireTrustedOrigin);

router.post('/logout', logout);
router.get('/me', me);
router.get('/appointments', validate('query', adminListQuerySchema), listAppointments);
router.get('/appointments/:id', validateObjectId('id'), getAppointment);
router.patch(
  '/appointments/:id',
  validateObjectId('id'),
  validate('body', statusPatchSchema),
  patchAppointment
);

export default router;
