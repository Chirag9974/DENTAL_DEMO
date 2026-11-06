import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Email provider abstraction — swap EMAIL_PROVIDER without touching business logic:
 *  - console : logs only (default; zero credentials, safe for demo/dev)
 *  - smtp    : any SMTP host — Brevo / SendGrid SMTP both work
 *  - resend  : Resend HTTP API
 * Future channels (SMS/WhatsApp) get their own service module, same pattern.
 */

let smtpTransporter = null;
function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;
  const { host, port, secure, user, pass } = config.email.smtp;
  if (!host || !user || !pass) {
    throw new Error('SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS)');
  }
  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return smtpTransporter;
}

async function sendViaSmtp({ to, subject, text, html }) {
  const info = await getSmtpTransporter().sendMail({
    from: config.email.from,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  });
  return { provider: 'smtp', messageId: info.messageId };
}

async function sendViaResend({ to, subject, text, html }) {
  if (!config.email.resendApiKey) throw new Error('RESEND_API_KEY is not configured');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.email.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.email.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
      ...(html ? { html } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = await res.json().catch(() => ({}));
  return { provider: 'resend', messageId: data.id || '' };
}

async function sendViaConsole({ to, subject, text }) {
  logger.info('[email:console] notification (no provider configured)', {
    to: '[redacted]',
    subject,
    chars: text.length,
  });
  return { provider: 'console', messageId: `console-${Date.now()}` };
}

export async function sendEmail(message) {
  switch (config.email.provider) {
    case 'smtp':
      return sendViaSmtp(message);
    case 'resend':
      return sendViaResend(message);
    case 'console':
    default:
      return sendViaConsole(message);
  }
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function staffNotificationFor(appt) {
  const subject = `New appointment request — ${appt.patientName} (${appt.preferredDate})`;
  const text = [
    'A new appointment request was submitted on the website.',
    '',
    `Name: ${appt.patientName}`,
    `Phone: ${appt.phone}`,
    appt.email ? `Email: ${appt.email}` : null,
    `Service: ${appt.service}`,
    `Preferred: ${appt.preferredDate} ${appt.preferredTime}`,
    appt.message ? `Message: ${appt.message}` : null,
    '',
    `Status: ${appt.status} | ID: ${appt._id}`,
    'Review it in the admin dashboard. Do not reply to this automated email.',
  ]
    .filter(Boolean)
    .join('\n');
  const html = `<h2>New appointment request</h2><ul><li><b>Name:</b> ${esc(appt.patientName)}</li><li><b>Service:</b> ${esc(appt.service)}</li><li><b>Preferred:</b> ${esc(appt.preferredDate)} ${esc(appt.preferredTime)}</li>${appt.message ? `<li><b>Message:</b> ${esc(appt.message)}</li>` : ''}</ul><p>Status: ${esc(appt.status)} · ID: ${esc(appt._id)}</p>`;
  return { to: config.email.notifyTo, subject, text, html };
}

export function patientAckFor(appt) {
  const subject = 'We received your appointment request';
  const text = [
    `Hi ${appt.patientName},`,
    '',
    'Thanks — we received your appointment request and the clinic will confirm shortly.',
    `You asked for: ${appt.service} on ${appt.preferredDate} ${appt.preferredTime}.`,
    'Please do not reply with detailed medical information by email.',
  ].join('\n');
  return { to: appt.email, subject, text };
}
