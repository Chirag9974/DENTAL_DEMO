import * as auth from '../services/auth.service.js';
import * as appointments from '../services/appointments.service.js';
import { setAdminCookie, clearAdminCookie } from '../middleware/auth.js';
import { ok, paginated } from '../utils/respond.js';
import { logger } from '../utils/logger.js';

export async function login(req, res, next) {
  try {
    const { token, admin } = await auth.loginAdmin(req.body.email, req.body.password);
    setAdminCookie(res, token);
    // Browser clients authenticate with the HttpOnly cookie only. Returning a
    // token to every browser response is needless XSS-accessible surface, so
    // non-browser clients must ask for one explicitly.
    const wantsBearer = String(req.get('x-auth-mode') || '').toLowerCase() === 'bearer';
    return ok(res, wantsBearer ? { admin, token } : { admin });
  } catch (err) {
    return next(err);
  }
}

export async function logout(req, res, next) {
  try {
    // Bump the token version so every cookie/Bearer token issued before this
    // sign-out stops working immediately, not when the JWT happens to expire.
    await auth.revokeAdminSessions(req.admin.id).catch((err) => {
      logger.error('[auth] could not revoke sessions', { error: err.message });
    });
    clearAdminCookie(res);
    return ok(res, { loggedOut: true });
  } catch (err) {
    return next(err);
  }
}

export async function me(req, res, next) {
  try {
    const { id, name, email, role } = req.admin;
    return ok(res, { admin: { id, name, email, role } });
  } catch (err) {
    return next(err);
  }
}

export async function listAppointments(req, res, next) {
  try {
    const { items, total } = await appointments.listAppointments(req.query);
    return paginated(res, items, { page: req.query.page, limit: req.query.limit, total });
  } catch (err) {
    return next(err);
  }
}

export async function getAppointment(req, res, next) {
  try {
    return ok(res, await appointments.getAppointment(req.params.id));
  } catch (err) {
    return next(err);
  }
}

export async function patchAppointment(req, res, next) {
  try {
    return ok(res, await appointments.updateAppointmentStatus(req.params.id, req.body));
  } catch (err) {
    return next(err);
  }
}
