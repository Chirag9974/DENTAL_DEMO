import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { appointmentBodySchema, statusPatchSchema, loginBodySchema } from '../src/middleware/validation.js';

describe('appointment validation', () => {
  const valid = {
    patientName: 'Aarav Sharma',
    phone: '+91 98765 43210',
    service: 'General Checkup',
    preferredDate: '2026-11-05',
    preferredTime: '10:30',
    message: 'Mild tooth pain.',
  };

  it('accepts a valid request', () => {
    assert.equal(appointmentBodySchema.safeParse(valid).success, true);
  });

  it('rejects missing fields, bad phone/date, oversized message, and unknown fields', () => {
    assert.equal(appointmentBodySchema.safeParse({}).success, false);
    assert.equal(appointmentBodySchema.safeParse({ ...valid, phone: 'abc' }).success, false);
    assert.equal(appointmentBodySchema.safeParse({ ...valid, preferredDate: '05-11-2026' }).success, false);
    assert.equal(appointmentBodySchema.safeParse({ ...valid, message: 'x'.repeat(501) }).success, false);
    // staffNote/status must never be settable via the public endpoint
    assert.equal(appointmentBodySchema.safeParse({ ...valid, status: 'Confirmed' }).success, false);
    assert.equal(appointmentBodySchema.safeParse({ ...valid, staffNote: 'vip' }).success, false);
    // CRLF injection must not reach email subjects or logs
    assert.equal(appointmentBodySchema.safeParse({ ...valid, patientName: 'Aarav\r\nBcc: evil@example.com' }).success, false);
    assert.equal(appointmentBodySchema.safeParse({ ...valid, service: 'Cleaning\nBcc: evil@example.com' }).success, false);
  });

  it('rejects past-shaped garbage time', () => {
    assert.equal(appointmentBodySchema.safeParse({ ...valid, preferredTime: '25:99' }).success, false);
  });
});

describe('admin patch + login validation', () => {
  it('requires at least one of status/staffNote and valid status', () => {
    assert.equal(statusPatchSchema.safeParse({}).success, false);
    assert.equal(statusPatchSchema.safeParse({ status: 'Nope' }).success, false);
    assert.equal(statusPatchSchema.safeParse({ status: 'Confirmed' }).success, true);
    assert.equal(statusPatchSchema.safeParse({ staffNote: 'Called, coming Friday' }).success, true);
  });

  it('validates login shape', () => {
    assert.equal(loginBodySchema.safeParse({ email: 'not-an-email', password: 'x' }).success, false);
    assert.equal(loginBodySchema.safeParse({ email: 'admin@demo.com', password: 'secret' }).success, true);
  });
});
