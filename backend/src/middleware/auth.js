import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { AdminUser } from '../models/AdminUser.js';

// __Host- forces Secure + Path=/ + no Domain, so a sibling origin can never
// overwrite the staff cookie. Browsers only accept it over HTTPS (production).
const COOKIE_NAME = config.isProd ? '__Host-admin_token' : 'admin_token';
const SESSION_MS = 8 * 60 * 60 * 1000;
const ISSUER = 'tooth-care-api';
const AUDIENCE = 'tooth-care-admin';

export function signAdminToken(admin) {
  return jwt.sign(
    { sub: String(admin._id), role: admin.role, ver: Number(admin.tokenVersion || 0) },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
      algorithm: 'HS256',
      issuer: ISSUER,
      audience: AUDIENCE,
    }
  );
}

export function setAdminCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    maxAge: SESSION_MS,
    path: '/',
  });
}

export function clearAdminCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

/** Protects every admin endpoint — accepts HttpOnly cookie OR Bearer token. */
export async function requireAdmin(req, _res, next) {
  try {
    const fromCookie = req.cookies?.[COOKIE_NAME];
    const header = req.headers.authorization;
    const fromHeader = typeof header === 'string' && header.startsWith('Bearer ')
      ? header.slice(7).trim()
      : null;
    const token = fromCookie || fromHeader;
    if (!token) throw AppError.unauthorized('Authentication required');

    const payload = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'], // pin the algorithm: no "alg: none" / confusion tricks
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (!payload.sub) throw AppError.unauthorized('Invalid or expired session');

    // Re-check the account on every request. Without this, a deactivated or
    // deleted staff member keeps full access until the JWT expires, role changes
    // are ignored, and signing out cannot actually revoke anything.
    const admin = await AdminUser.findById(payload.sub);
    if (!admin || !admin.active) throw AppError.unauthorized('Invalid or expired session');
    if (Number(payload.ver || 0) !== Number(admin.tokenVersion || 0)) {
      throw AppError.unauthorized('Session has been revoked');
    }

    req.admin = {
      id: String(admin._id),
      name: admin.name,
      email: admin.email,
      role: admin.role,
      authMethod: fromCookie ? 'cookie' : 'bearer',
    };
    return next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    return next(AppError.unauthorized('Invalid or expired session'));
  }
}
