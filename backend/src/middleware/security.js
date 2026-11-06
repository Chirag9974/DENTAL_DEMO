import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const LOOPBACK_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/** Never let a browser or intermediary cache PII, sessions or auth responses. */
export function noStore(_req, res, next) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  return next();
}

/**
 * CSRF defense in depth for the HttpOnly-cookie session.
 * `SameSite=Lax` already blocks cross-site POSTs in modern browsers; this also
 * rejects forged Origin/Referer values and cross-site fetch metadata.
 * Requests with neither header (curl, native apps, tests) are allowed — those
 * clients do not carry a browser cookie automatically.
 */
export function requireTrustedOrigin(req, _res, next) {
  if (!MUTATING_METHODS.has(req.method)) return next();

  const site = req.get('sec-fetch-site');
  if (site === 'cross-site') return next(AppError.forbidden('Cross-site request blocked'));

  const isTrusted = (value) =>
    config.frontendUrls.includes(value) || (!config.isProd && LOOPBACK_ORIGIN.test(value));

  const origin = req.get('origin');
  if (origin) {
    return isTrusted(origin) ? next() : next(AppError.forbidden('Origin not allowed'));
  }

  const referer = req.get('referer');
  if (referer) {
    try {
      if (isTrusted(new URL(referer).origin)) return next();
    } catch {
      /* malformed referer — fall through to the rejection below */
    }
    return next(AppError.forbidden('Referer not allowed'));
  }

  return next();
}

/** Broad flood control for every API route; per-route limiters stay in place. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX || 600),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  message: { success: false, error: 'Too many requests, please try again later.' },
});
