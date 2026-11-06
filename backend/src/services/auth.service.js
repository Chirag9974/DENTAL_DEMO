import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { AdminUser } from '../models/AdminUser.js';
import { AppError } from '../utils/errors.js';
import { signAdminToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

/**
 * A real bcrypt hash (cost 12) of a random throwaway value, generated once at
 * boot. The previous fixed string was not a valid bcrypt hash, so bcryptjs
 * returned in ~5 ms instead of doing the work — and the "user exists" path took
 * ~250 ms. That difference is a reliable account-enumeration oracle.
 */
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(24).toString('hex'), 12);

export async function loginAdmin(email, password) {
  const admin = await AdminUser.findOne({ email: String(email).toLowerCase().trim() }).select('+passwordHash');

  if (!admin || !admin.active) {
    // Same work (and therefore same timing) as a wrong password for a real user.
    await bcrypt.compare(password, DUMMY_HASH).catch(() => {});
    logger.warn('[auth] sign-in failed', { email, reason: 'unknown-or-inactive' });
    throw AppError.unauthorized('Invalid email or password');
  }

  const okPassword = await bcrypt.compare(password, admin.passwordHash);
  if (!okPassword) {
    logger.warn('[auth] sign-in failed', { email, reason: 'bad-password' });
    throw AppError.unauthorized('Invalid email or password');
  }

  await AdminUser.updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } }).catch(() => {});
  logger.info('[auth] sign-in ok', { adminId: String(admin._id) });

  const token = signAdminToken(admin);
  return {
    token,
    admin: { id: String(admin._id), name: admin.name, email: admin.email, role: admin.role },
  };
}

/** Invalidates every JWT previously issued to this admin. */
export async function revokeAdminSessions(adminId) {
  await AdminUser.updateOne({ _id: adminId }, { $inc: { tokenVersion: 1 } });
  logger.info('[auth] sessions revoked', { adminId: String(adminId) });
}
