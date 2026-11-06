import 'dotenv/config.js';

/**
 * Central environment config.
 * Fail fast on missing/weak production secrets, stay convenient in development.
 * Add future integrations here (SMS, calendar, payments) as optional env vars
 * so routes/services never read process.env directly.
 */
const DEV_JWT_SECRET = 'dev-only-insecure-secret-change-in-prod';
const isProd = process.env.NODE_ENV === 'production';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if ((value === undefined || value === '') && isProd) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/**
 * Client IPs decide rate limits, so `trust proxy` must be explicit.
 * Default false = the socket address is the client (safe when directly exposed).
 * Set TRUST_PROXY=1 only when exactly one proxy you control sits in front,
 * otherwise callers can spoof X-Forwarded-For and dodge the login throttles.
 */
function parseTrustProxy(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return false;
  const value = String(raw).trim().toLowerCase();
  if (value === 'false' || value === '0' || value === 'off') return false;
  if (value === 'true' || value === 'on') return 1; // exactly one proxy hop
  if (/^\d+$/.test(value)) return Number(value);
  return value; // express names: loopback, linklocal, uniquelocal
}

const jwtSecret = process.env.JWT_SECRET || DEV_JWT_SECRET;
if (isProd) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be set in production');
  if (jwtSecret === DEV_JWT_SECRET) throw new Error('JWT_SECRET must not be the development default in production');
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production');
} else if (!process.env.JWT_SECRET) {
  console.warn('[warn] Using insecure dev JWT_SECRET. Set JWT_SECRET in .env for anything real.');
}

const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (isProd && frontendUrls.some((u) => /localhost|127\.0\.0\.1|\[::1\]/.test(u))) {
  console.warn('[warn] FRONTEND_URL still points at localhost in production — CORS will reject the real site.');
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProd,
  port: Number(process.env.PORT || 5000),
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  frontendUrls,

  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/dental_demo'),

  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  // A Secure cookie is mandatory in production; COOKIE_SECURE cannot weaken it.
  cookieSecure: isProd ? true : String(process.env.COOKIE_SECURE || 'false') === 'true',

  adminSeed: {
    name: process.env.ADMIN_NAME || 'Clinic Admin',
    email: process.env.ADMIN_EMAIL || 'admin@demodentalcare.com',
    password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
  },

  email: {
    // console | smtp | resend — new providers slot in via services/email.service.js
    provider: (process.env.EMAIL_PROVIDER || 'console').toLowerCase(),
    from: process.env.EMAIL_FROM || 'Demo Dental Care <no-reply@demodentalcare.com>',
    notifyTo: process.env.CLINIC_NOTIFY_EMAIL || 'clinic@demodentalcare.com',
    patientAckEnabled: String(process.env.PATIENT_ACK_ENABLED || 'false') === 'true',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    resendApiKey: process.env.RESEND_API_KEY || '',
  },

  clinicFallback: {
    whatsappNumber: process.env.CLINIC_WHATSAPP_NUMBER || '',
    address: process.env.CLINIC_ADDRESS || '',
  },
};
