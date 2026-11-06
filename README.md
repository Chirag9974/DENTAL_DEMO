# Tooth Care Dental Clinic — website + staff console

Patient-facing site and staff admin console for a dental clinic in Jaipur.
Visitors request an appointment; every request starts as **Pending** and is
confirmed by the clinic by phone.

## Stack

- **Frontend:** React 19 + Vite 6, React Router, plain CSS
- **Backend:** Express 4 + MongoDB (Mongoose), Zod validation, JWT in an HttpOnly cookie
- **Dev:** one launcher that starts MongoDB (optional), seeds data, the API and Vite

## Quick start

Requires Node 22+ and MongoDB on `127.0.0.1:27017` (or use `demo/devdb`).

```bash
cd backend && npm install
cp .env.example .env          # Windows: copy .env.example .env
cd ../demo/frontend && npm install
cd ../.. && node demo/dev.js
```

| | |
|---|---|
| Website | <http://localhost:5173> |
| Staff console | <http://localhost:5173/admin> |
| API | <http://localhost:5000> (proxied as `/api` on the web port) |

The launcher prints the seeded staff login on startup. Stop with `Ctrl+C` or
`node demo/stop.js`.

## Structure

```
backend/            Express API, models, services, middleware and tests
demo/frontend/      React app (public site + /admin console)
demo/dev.js         one-command local stack
demo/devdb/         optional local MongoDB launcher
demo/stop.js        stops only the processes the launcher recorded
```

## Tests

```bash
cd backend && npm test
```

Runs 30 tests, including a security suite that exercises cookies, session
revocation, CSRF/origin checks, rate limiting, idempotency privacy and input
validation. The suite uses a separate `dental_security_test` database and drops
it afterwards; it never touches the demo database.

## Security

- Rate limits on public bookings, login (per IP **and** per account) and all `/api`
- Origin/Referer + `Sec-Fetch-Site` guard on staff mutations; `SameSite=Lax` HttpOnly cookie, `__Host-` + `Secure` in production
- bcrypt-12 hashes with a real dummy hash so login timing does not reveal whether an email exists
- JWT pinned to HS256; every admin request revalidates the account, so deactivation and sign-out revoke access immediately
- `Cache-Control: no-store` on patient and admin responses; request bodies capped at 50 kb
- Strict CSP and hardening headers for the built site (`demo/frontend/public/_headers`), no inline scripts
- PII-redacting logs that never record query strings; idempotent retries scoped to the same phone number
- Production refuses a missing/short/default `JWT_SECRET`; `TRUST_PROXY` stays off unless the API is actually behind a trusted proxy

See [backend/README.md](backend/README.md) for API details and the full security notes.

## Environment

Never commit `.env` — only `.env.example` is tracked. For production, set a
strong `JWT_SECRET`, keep `COOKIE_SECURE` on, terminate TLS in front of the API,
and set `TRUST_PROXY` only to the proxy you control.

## Build & deploy

```bash
cd demo/frontend && npm run build
```

For a single-origin deployment, run the API with `NODE_ENV=production`; Express
serves `demo/frontend/dist` itself, so the admin cookie stays first-party and the
CSP can stay at `'self'`. That is how the Render service is configured: build
the backend and frontend, seed, then `npm start` from `backend/`.

You can also host `dist/` on any static host (it includes `_headers`) and point
`VITE_API_BASE` at the API, but the admin cookie then needs cross-origin setup.
