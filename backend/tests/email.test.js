import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { staffNotificationFor, patientAckFor } from '../src/services/email.service.js';

describe('email templates', () => {
  const appt = {
    _id: '507f1f77bcf86cd799439011',
    patientName: 'Aarav Sharma',
    phone: '+919876543210',
    email: 'aarav@example.com',
    service: 'General Checkup',
    preferredDate: '2026-11-05',
    preferredTime: '10:30',
    message: 'Hello <script>alert(1)</script>',
    status: 'Pending',
  };

  it('builds a staff notification with request details', () => {
    const msg = staffNotificationFor(appt);
    assert.ok(msg.to && msg.subject.includes('Aarav') && msg.text.includes('General Checkup'));
    // HTML must escape user input (XSS-safe email body)
    assert.ok(!msg.html.includes('<script>') && msg.html.includes('&lt;script&gt;'));
  });

  it('builds a patient acknowledgement without medical advice', () => {
    const msg = patientAckFor(appt);
    assert.equal(msg.to, 'aarav@example.com');
    assert.ok(msg.text.includes('will confirm shortly'));
  });
});
