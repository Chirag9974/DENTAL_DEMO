import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = process.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Applied in dev and preview. The built site gets the same set (plus CSP) from
// public/_headers on static hosts.
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

// No inline scripts remain (the motion bootstrap is a same-origin file) and the
// module-preload polyfill is disabled below, so 'self' is enough for scripts.
// Inline style attributes are used by React, hence 'unsafe-inline' for styles.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// The dev server proxies /api + /health to the Express backend so the browser
// talks same-origin (cookies work, no CORS setup needed in development).
export default defineConfig({
  plugins: [react()],
  build: {
    // Vite's polyfill is injected as an inline script, which a strict CSP would
    // block; modern browsers do not need it.
    modulePreload: { polyfill: false },
  },
  server: {
    port: 5173,
    // never silently fall back to another port — the launcher and docs promise 5173
    strictPort: true,
    headers: securityHeaders,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: false },
      '/health': { target: BACKEND, changeOrigin: false },
    },
  },
  preview: {
    port: 4173,
    headers: { ...securityHeaders, 'Content-Security-Policy': contentSecurityPolicy },
  },
});
