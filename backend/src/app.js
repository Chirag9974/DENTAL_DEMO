import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config/env.js';
import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { apiLimiter, noStore } from './middleware/security.js';

/**
 * Express app factory. Middleware order matters:
 * security → parsers → logging → routes → 404 → central error handler.
 */
export function buildApp() {
  const app = express();
  app.disable('x-powered-by');

  // Only trust forwarded client IPs when the operator explicitly says a proxy
  // exists. Trusting them by default lets anyone spoof X-Forwarded-For and walk
  // around the login/appointment rate limits.
  if (config.trustProxy !== false) app.set('trust proxy', config.trustProxy);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // HSTS is meaningless over plain HTTP and only safe once HTTPS is real.
      hsts: config.isProd ? { maxAge: 15552000, includeSubDomains: true } : false,
      referrerPolicy: { policy: 'no-referrer' },
    })
  );

  app.use(
    cors({
      origin: config.frontendUrls,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'Idempotency-Key', 'X-Auth-Mode'],
      maxAge: 600,
    })
  );

  app.use(compression());

  // Escape <, > and & inside JSON so a response can never be interpreted as
  // markup if a browser or proxy is ever tricked into sniffing it as HTML.
  app.set('json escape', true);

  app.use(express.json({ limit: '50kb', strict: true })); // small cap: appointment forms never need more
  app.use(cookieParser());

  if (config.env !== 'test') {
    // Path only. The query string can contain a patient name or phone number
    // from the staff search box — that must never reach a log file.
    morgan.token('path', (req) => req.path);
    app.use(morgan(':method :path :status :response-time ms'));
  }

  app.get('/health', noStore, (_req, res) => {
    res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
  });

  app.use('/api', apiLimiter);
  app.use('/api', publicRoutes);
  app.use('/api/admin', noStore, adminRoutes);

  app.use((req, res) => {
    res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.path}` });
  });

  // Central error handler — consistent shape, no stack traces to clients.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
    if (status >= 500) {
      console.error(new Date().toISOString(), '[error]', err.message);
    }
    res.status(status).json({
      success: false,
      error: status >= 500 ? 'Something went wrong, please try again later.' : err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  });

  return app;
}
