import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { buildApp } from '../src/app.js';
import { config } from '../src/config/env.js';
import { AdminUser } from '../src/models/AdminUser.js';
import { Appointment } from '../src/models/Appointment.js';

const TEST_DB = 'mongodb://127.0.0.1:27017/dental_security_test';
const ALLOWED_ORIGIN = config.frontendUrls[0] || 'http://localhost:5173';
const TEST_PASSWORD = 'Str0ng-Test-Passw0rd!';

// The suite still runs its HTTP checks when MongoDB is absent; only the
// session/patient-privacy block is skipped, and the reason is reported.
let dbReady = false;
try {
  await mongoose.connect(TEST_DB, { serverSelectionTimeoutMS: 1500 });
  dbReady = true;
} catch {
  dbReady = false;
}

async function startServer() {
  const app = buildApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  return { server, base: `http://127.0.0.1:${server.address().port}` };
}

// Keep the connection open for the HTTP suite (its throttling test signs in and
// therefore touches the database), then clean up once the whole file is done.
after(async () => {
  if (!dbReady) return;
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

const appointmentPayload = (phone, patientName) => ({
  patientName,
  phone,
  service: 'General Check-up & Cleaning',
  preferredDate: '2026-12-01',
  preferredTime: '10:00',
  message: '',
});

// Runs first so the shared per-IP login limiter still has headroom.
describe('security: admin sessions and patient privacy', { skip: dbReady ? false : 'MongoDB not running on 127.0.0.1:27017' }, () => {
  let server;
  let base;

  before(async () => {
    ({ server, base } = await startServer());
    await AdminUser.deleteMany({ email: /@security-test\.local$/ });
    await Appointment.deleteMany({ phone: /^\+9199/ });
  });

  after(async () => {
    await AdminUser.deleteMany({ email: /@security-test\.local$/ });
    await Appointment.deleteMany({ phone: /^\+9199/ });
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  async function newAdmin(tag) {
    const email = `${tag}@security-test.local`;
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
    const admin = await AdminUser.create({ name: `Sec ${tag}`, email, passwordHash, role: 'admin', active: true });
    return { admin, email };
  }

  async function signIn(email, { bearer = false, origin } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (bearer) headers['X-Auth-Mode'] = 'bearer';
    if (origin) headers.Origin = origin;
    return fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password: TEST_PASSWORD }),
    });
  }

  function cookieHeader(res) {
    return (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  }

  it('sets an HttpOnly, SameSite=Lax cookie and does not leak a token to browsers', async () => {
    const { email } = await newAdmin('cookie');
    const res = await signIn(email);
    assert.equal(res.status, 200);

    const raw = res.headers.getSetCookie();
    assert.ok(raw.length, 'expected a Set-Cookie header');
    assert.match(raw[0], /HttpOnly/i);
    assert.match(raw[0], /SameSite=Lax/i);
    assert.match(raw[0], /Path=\//i);
    assert.match(res.headers.get('cache-control') || '', /no-store/);

    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.token, undefined, 'browser login must not return a bearer token');
    assert.equal(body.data.admin.email, email);
  });

  it('returns a Bearer token only when the client opts in, and accepts it', async () => {
    const { email } = await newAdmin('bearer');
    const res = await signIn(email, { bearer: true });
    const body = await res.json();
    assert.equal(typeof body.data.token, 'string');

    const me = await fetch(`${base}/api/admin/me`, {
      headers: { Authorization: `Bearer ${body.data.token}` },
    });
    assert.equal(me.status, 200);
    assert.match(me.headers.get('cache-control') || '', /no-store/);
    assert.equal((await me.json()).data.admin.email, email);
  });

  it('revokes the cookie and every existing token on sign-out', async () => {
    const { email } = await newAdmin('revoke');
    const res = await signIn(email);
    const cookie = cookieHeader(res);

    const before = await fetch(`${base}/api/admin/me`, { headers: { Cookie: cookie } });
    assert.equal(before.status, 200);

    const out = await fetch(`${base}/api/admin/logout`, {
      method: 'POST',
      headers: { Cookie: cookie, Origin: ALLOWED_ORIGIN },
    });
    assert.equal(out.status, 200);

    const afterRes = await fetch(`${base}/api/admin/me`, { headers: { Cookie: cookie } });
    assert.equal(afterRes.status, 401);
  });

  it('rejects a session as soon as the admin is deactivated', async () => {
    const { admin, email } = await newAdmin('deactivate');
    const res = await signIn(email);
    const cookie = cookieHeader(res);
    assert.equal((await fetch(`${base}/api/admin/me`, { headers: { Cookie: cookie } })).status, 200);

    await AdminUser.updateOne({ _id: admin._id }, { $set: { active: false } });
    const me = await fetch(`${base}/api/admin/me`, { headers: { Cookie: cookie } });
    assert.equal(me.status, 401);
  });

  it('blocks cross-site cookie mutations and keeps the session intact', async () => {
    const { email } = await newAdmin('csrf');
    const res = await signIn(email);
    const cookie = cookieHeader(res);

    const forged = await fetch(`${base}/api/admin/logout`, {
      method: 'POST',
      headers: { Cookie: cookie, Origin: 'https://evil.example' },
    });
    assert.equal(forged.status, 403);

    const stillValid = await fetch(`${base}/api/admin/me`, { headers: { Cookie: cookie } });
    assert.equal(stillValid.status, 200);
  });

  it('answers a malformed appointment id with 404, not a 500', async () => {
    const { email } = await newAdmin('lookup');
    const res = await signIn(email);
    const cookie = cookieHeader(res);
    const bad = await fetch(`${base}/api/admin/appointments/not-an-object-id`, { headers: { Cookie: cookie } });
    assert.equal(bad.status, 404);
    assert.equal((await bad.json()).success, false);
  });

  it('never discloses one patient record to a different phone number with the same key', async () => {
    const key = 'sec-test-key-0001';
    const first = await fetch(`${base}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': key },
      body: JSON.stringify(appointmentPayload('+919900000001', 'Patient One')),
    });
    assert.equal(first.status, 201);
    const firstBody = await first.json();
    assert.match(first.headers.get('cache-control') || '', /no-store/);

    const retry = await fetch(`${base}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': key },
      body: JSON.stringify(appointmentPayload('+919900000001', 'Patient One')),
    });
    assert.equal((await retry.json()).data.id, firstBody.data.id, 'same patient retry must dedupe');

    const other = await fetch(`${base}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': key },
      body: JSON.stringify(appointmentPayload('+919900000002', 'Patient Two')),
    });
    assert.equal(other.status, 201);
    const otherBody = await other.json();
    assert.notEqual(otherBody.data.id, firstBody.data.id);
    assert.equal(otherBody.data.phone, '+919900000002');
    assert.equal(otherBody.data.patientName, 'Patient Two');
  });

  it('never lets a honeypot submission retrieve a real record through a known key', async () => {
    const key = 'sec-test-key-0002';
    const real = await fetch(`${base}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': key },
      body: JSON.stringify(appointmentPayload('+919900000003', 'Real Patient')),
    });
    const realBody = await real.json();

    const bot = await fetch(`${base}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': key },
      body: JSON.stringify({ ...appointmentPayload('+919900000003', 'Real Patient'), website: 'http://spam.example' }),
    });
    assert.equal(bot.status, 201);
    const botBody = await bot.json();
    assert.equal(botBody.data.id, 'received');
    assert.notEqual(botBody.data.id, realBody.data.id);
  });
});

describe('security: HTTP hardening', () => {
  let server;
  let base;

  before(async () => {
    ({ server, base } = await startServer());
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  it('does not advertise the stack and sets browser hardening headers', async () => {
    const res = await fetch(`${base}/health`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
    assert.match(res.headers.get('cache-control') || '', /no-store/);
  });

  it('does not disclose the runtime environment on /health', async () => {
    const body = await (await fetch(`${base}/health`)).json();
    assert.equal(body.data.status, 'ok');
    assert.equal(body.data.env, undefined);
  });

  it('mirrors CORS only for allowlisted origins', async () => {
    const allowed = await fetch(`${base}/api/clinic`, { headers: { Origin: ALLOWED_ORIGIN } });
    assert.equal(allowed.headers.get('access-control-allow-origin'), ALLOWED_ORIGIN);

    const evil = await fetch(`${base}/api/clinic`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(evil.headers.get('access-control-allow-origin'), null);
  });

  it('rejects unauthenticated admin reads with 401 and no-store', async () => {
    const res = await fetch(`${base}/api/admin/appointments`);
    assert.equal(res.status, 401);
    assert.match(res.headers.get('cache-control') || '', /no-store/);
    assert.equal((await res.json()).success, false);
  });

  it('rejects an oversized JSON body before it reaches a route', async () => {
    const res = await fetch(`${base}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientName: 'A'.repeat(60000) }),
    });
    assert.equal(res.status, 413);
  });

  it('rejects malformed JSON cleanly', async () => {
    const res = await fetch(`${base}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"patientName":',
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.stack, undefined);
  });

  it('rejects a cross-site Origin on sign-in (login CSRF)', async () => {
    const res = await fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: JSON.stringify({ email: 'attacker@example.com', password: 'whatever' }),
    });
    assert.equal(res.status, 403);
  });

  it('rejects cross-site fetch metadata even without an Origin header', async () => {
    const res = await fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site' },
      body: JSON.stringify({ email: 'attacker@example.com', password: 'whatever' }),
    });
    assert.equal(res.status, 403);
  });

  it('still serves non-browser clients that send no Origin', async () => {
    const res = await fetch(`${base}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 400); // validation, not an origin rejection
  });

  it('rejects malformed idempotency keys', async () => {
    const res = await fetch(`${base}/api/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': 'short' },
      body: JSON.stringify(appointmentPayload('+919900000004', 'Key Test')),
    });
    assert.equal(res.status, 400);
    assert.match((await res.json()).error, /Idempotency/i);
  });

  it('throttles repeated sign-ins and ignores spoofed X-Forwarded-For', async () => {
    let last;
    for (let i = 0; i < 12; i++) {
      last = await fetch(`${base}/api/admin/login`, {
        method: 'POST',
        // If the forwarded header were trusted, each request would look like a
        // new IP and the limiter would never fire.
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `203.0.113.${i}` },
        body: JSON.stringify({ email: 'rate-limit@example.com', password: 'definitely-wrong' }),
      });
      if (last.status === 429) break;
    }
    assert.equal(last.status, 429, 'repeated failed sign-ins should be rate limited');
  });
});
