import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AppError } from '../utils/errors.js';
import { APPOINTMENT_STATUSES } from '../models/Appointment.js';

/** Validate req.body/query/params against a zod schema; rejects unknown admin-only fields on public routes. */
export function validate(source, schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.') || source,
        message: i.message,
      }));
      return next(AppError.badRequest('Validation failed', details));
    }
    req[source] = result.data;
    return next();
  };
}

/** Route params are user input too: a malformed ObjectId is a 404, never a 500. */
export function validateObjectId(param = 'id') {
  return (req, _res, next) => {
    if (!mongoose.isValidObjectId(req.params[param])) {
      return next(AppError.notFound('Appointment not found'));
    }
    return next();
  };
}

// ---------- Shared field rules (server is the source of truth) ----------
// Control characters (CR/LF especially) must never reach email subjects or log
// lines — that is how header/log injection starts.
const NO_CONTROL = /[\u0000-\u001F\u007F]/;
const nameRule = z
  .string()
  .trim()
  .min(2, 'Name is too short')
  .max(80)
  .refine((v) => !NO_CONTROL.test(v), 'Name contains invalid characters');
const phoneRule = z
  .string()
  .trim()
  .min(7, 'Phone looks too short')
  .max(25)
  .regex(/^[+\d][\d\s\-()]*$/, 'Phone contains invalid characters');
const emailRule = z.string().trim().toLowerCase().max(120).email('Invalid email address');
const optionalEmail = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((v) => (v === undefined ? '' : v))
  .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Invalid email address');
const dateRule = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00`)), 'Invalid date');
const timeRule = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .regex(/^([01]\d|2[0-3]):[0-5]\d$|^(Morning|Afternoon|Evening)$/i, 'Time must be HH:MM or Morning/Afternoon/Evening');

export const appointmentBodySchema = z
  .object({
    patientName: nameRule,
    phone: phoneRule,
    email: optionalEmail,
    service: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .refine((v) => !NO_CONTROL.test(v), 'Treatment contains invalid characters'),
    preferredDate: dateRule,
    preferredTime: timeRule,
    message: z
      .string()
      .trim()
      .max(500)
      // Newlines/tabs are fine in a note; other control bytes are not.
      .refine((v) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(v), 'Message contains invalid characters')
      .optional()
      .default(''),
    // Honeypot: real users leave it empty; bots fill it → silently accept but ignore.
    website: z.string().max(200).optional().default(''),
  })
  .strict();

export const loginBodySchema = z.object({
  email: emailRule,
  password: z.string().min(1, 'Password is required').max(200),
}).strict();

export const statusPatchSchema = z
  .object({
    status: z.enum(APPOINTMENT_STATUSES).optional(),
    staffNote: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine((v) => v.status !== undefined || v.staffNote !== undefined, {
    message: 'Provide status and/or staffNote',
  });

export const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  date: dateRule.optional(),
  search: z.string().trim().max(80).optional(),
});

// Bounded + charset-restricted so a client can never stuff a huge or structured
// value into the unique idempotency index.
export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8, 'Idempotency key is too short')
  .max(100, 'Idempotency key is too long')
  .regex(/^[A-Za-z0-9_.:-]+$/, 'Idempotency key contains invalid characters');

// ---------- Abuse controls ----------
export const appointmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 appointment submissions per IP per 15 min — generous for a demo, stops floods
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // slow brute force on the admin login
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts, please try again later.' },
});

/**
 * Second throttle keyed by account + IP, so distributing requests across many
 * source addresses still cannot spray one account. Runs after body validation,
 * so the key is the normalized email.
 */
export const loginEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `${String(req.body?.email || '').toLowerCase()}|${req.ip}`,
  message: { success: false, error: 'Too many sign-in attempts for this account, please try again later.' },
});
