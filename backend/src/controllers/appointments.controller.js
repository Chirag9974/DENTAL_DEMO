import * as appointments from '../services/appointments.service.js';
import { idempotencyKeySchema } from '../middleware/validation.js';
import { AppError } from '../utils/errors.js';
import { created } from '../utils/respond.js';

/** POST /api/appointments — public request intake. Save first, notify after (handled in service). */
export async function createAppointment(req, res, next) {
  try {
    const raw = req.headers['x-idempotency-key'] ?? req.headers['idempotency-key'];
    let idempotencyKey;

    if (raw !== undefined) {
      const parsed = idempotencyKeySchema.safeParse(raw);
      if (!parsed.success) throw AppError.badRequest('Invalid X-Idempotency-Key header');
      idempotencyKey = parsed.data;
    }

    const { appointment } = await appointments.createAppointment(req.body, idempotencyKey);
    return created(res, appointment, 'Request received. The clinic will confirm your appointment shortly.');
  } catch (err) {
    return next(err);
  }
}
