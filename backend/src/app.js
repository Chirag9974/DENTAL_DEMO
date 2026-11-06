import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(here, '../../demo/frontend/dist');

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
      frameguard: { action: 'deny' },
      // HSTS is meaningless over plain HTTP and only safe once HTTPS is real.
      hsts: config.isProd ? { maxAge: 15552000, includeSubDomains: true } : false,
      referrerPolicy: { policy: 'no-referrer' },
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          ...(config.isProd ? { upgradeInsecureRequests: [] } : {}),
        },
      },
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

  // Production: serve the built React app from the same origin as the API.
  // This keeps the admin cookie first-party and lets the CSP stay at 'self'.
  if (config.serveFrontend) {
    const indexFile = path.join(frontendDist, 'index.html');
    if (fs.existsSync(indexFile)) {
      app.use(
        express.static(frontendDist, {
          index: false,
          maxAge: '1h',
          setHeaders(res, filePath) {
            if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-store');
          },
        })
      );
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path === '/health') return next();
        res.setHeader('Cache-Control', 'no-store');
        res.sendFile(indexFile);
      });
    } else {
      console.warn('[web] frontend build not found at', frontendDist);
    }
  }

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
