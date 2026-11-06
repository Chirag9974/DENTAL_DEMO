/**
 * Safe logger — redacts PII/secrets so request logs never leak
 * phone numbers, tokens, passwords, or full message bodies.
 */
const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'token',
  'authorization',
  'cookie',
  'set-cookie',
  'phone',
  'email',
  'message',
  'staffnote',
  'idempotencykey',
  'secret',
  'apikey',
  'api_key',
  'resend_api_key',
  'smtp_pass',
];

function redact(value, key) {
  if (value === undefined || value === null) return value;
  if (key && SENSITIVE_KEYS.includes(String(key).toLowerCase())) return '[redacted]';
  if (typeof value === 'string' && /^\d[\d\s\-+()]{6,}$/.test(value)) return '[redacted-phone?]';
  return value;
}

function safeClone(obj, depth = 0) {
  if (depth > 3 || obj === null || typeof obj !== 'object') {
    return typeof obj === 'string' ? redact(obj) : obj;
  }
  if (Array.isArray(obj)) return obj.map((v) => safeClone(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'object' && v !== null ? safeClone(v, depth + 1) : redact(v, k);
  }
  return out;
}

export const logger = {
  info(...args) {
    console.log(new Date().toISOString(), '[info]', ...args.map((a) => (typeof a === 'object' ? JSON.stringify(safeClone(a)) : a)));
  },
  warn(...args) {
    console.warn(new Date().toISOString(), '[warn]', ...args.map((a) => (typeof a === 'object' ? JSON.stringify(safeClone(a)) : a)));
  },
  error(...args) {
    console.error(new Date().toISOString(), '[error]', ...args.map((a) => (a instanceof Error ? a.message : typeof a === 'object' ? JSON.stringify(safeClone(a)) : a)));
  },
};
