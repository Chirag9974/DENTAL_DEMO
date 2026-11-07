# Demo Dental Care — Backend

Express REST API + MongoDB for the appointment-**request** workflow from the architecture PDF.
Patient submits a request → saved as `Pending` → staff notified by email → staff confirms in admin dashboard.

## Quick start

```bash
cd backend
npm install
cp .env.example .env   # (Windows: copy .env.example .env) — .env already exists for local dev
# start MongoDB locally, then:
npm run seed   # creates admin user + clinic profile + services
npm run dev    # http://localhost:5000/health
```

Default dev admin (change immediately): `admin@demodentalcare.com` / `ChangeMe123!`

## API

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/health` | public | liveness check |
| GET | `/api/clinic` | public | clinic name, address, hours, map + WhatsApp links |
| GET | `/api/services` | public | active treatments |
| POST | `/api/appointments` | public, rate-limited | validate → save `Pending` → staff email → `{ id }` |
| POST | `/api/admin/login` | rate-limited | sets HttpOnly `admin_token` cookie; returns a Bearer token only with `X-Auth-Mode: bearer` |
| POST | `/api/admin/logout` | admin | clears cookie |
| GET | `/api/admin/me` | admin | current admin |
| GET | `/api/admin/appointments?page&limit&status&date&search` | admin | paginated list |
| GET | `/api/admin/appointments/:id` | admin | one record |
| PATCH | `/api/admin/appointments/:id` | admin | `{ status, staffNote }` — transitions validated |

`POST /api/appointments` accepts optional `X-Idempotency-Key` header — retries with the same key return the original record instead of a duplicate. Include a hidden `website` field (honeypot) in the form; bots that fill it get a fake success and nothing is stored.

## Email

`EMAIL_PROVIDER=console` (default) just logs — zero setup for the demo.
When ready: set `EMAIL_PROVIDER=smtp` + `SMTP_*` (Brevo/SendGrid SMTP) **or** `EMAIL_PROVIDER=resend` + `RESEND_API_KEY`, plus a verified `EMAIL_FROM` and staff `CLINIC_NOTIFY_EMAIL`. The appointment save never fails because email failed — failures are logged and flagged on the record.

## Room for future changes (no rewrites needed)

- **New providers** (SMS/WhatsApp/Calendar/Payments): add `src/services/<channel>.service.js` + env vars in `src/config/env.js`, call it from the service layer — routes stay untouched.
- **More statuses / record fields**: extend `APPOINTMENT_STATUSES` transitions + Mongoose schema; public vs admin views are separate functions so staff-only fields never leak.
- **More roles**: `AdminUser.role` already supports `admin`/`staff`; add checks in `requireAdmin` or a `requireRole` wrapper.
- **Multi-location**: add a `key` field to `Clinic` and accept `?location=` — `GET /api/clinic` keeps working.
- **Reminders/audit**: hook into `updateAppointmentStatus`; `emailStatus` on the record already tracks notification state.

## Security notes (per PDF)

HTTPS in prod · secrets in env only · HttpOnly `SameSite=Lax` cookie (host-prefixed `__Host-` in production) · bcrypt-12 hashes · JWT pinned to HS256 with issuer/audience · every admin request re-checks the account, so deactivation and sign-out revoke access immediately · rate limits on `/appointments`, `/login` (per IP and per account) and all `/api` · Origin/Referer + `Sec-Fetch-Site` guard on staff mutations · 50kb JSON cap · 30s request / 15s header timeouts · central error handler (no stack traces) · PII-redacting logger that never logs query strings · `Cache-Control: no-store` on every admin and patient response · `staffNote` is `select:false` (admin-only) · idempotent retries are scoped to the same phone number so a guessed key cannot disclose another patient's record · Zod validation with a bounded idempotency key and ObjectId guards.

`TRUST_PROXY` is empty by default: only set it to `1` (or the address of a proxy you control) when the API is actually behind one. Otherwise callers can spoof `X-Forwarded-For` and defeat IP rate limits.

Production startup refuses a missing/short `JWT_SECRET`, the seed refuses the demo password or anything under 12 characters, and `COOKIE_SECURE` is forced on. For a temporary demo deploy, set `ALLOW_WEAK_ADMIN_PASSWORD=true` to bypass the 12-character seed minimum; remove it and re-seed with a strong password before a real launch.
