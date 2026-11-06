import mongoose from 'mongoose';
import { Appointment } from '../models/Appointment.js';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';
import { sendEmail, staffNotificationFor, patientAckFor } from './email.service.js';

/**
 * Appointment business rules live here — controllers stay thin.
 * Key reliability rule: the DB save NEVER depends on email success.
 * Notifications run after the save; failures are logged + flagged on the
 * record (emailStatus) without failing the patient's request.
 */

function publicView(doc) {
  return {
    id: String(doc._id),
    patientName: doc.patientName,
    phone: doc.phone,
    email: doc.email || undefined,
    service: doc.service,
    preferredDate: doc.preferredDate,
    preferredTime: doc.preferredTime,
    message: doc.message || undefined,
    status: doc.status,
    createdAt: doc.createdAt,
  };
}

function adminView(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(obj._id),
    patientName: obj.patientName,
    phone: obj.phone,
    email: obj.email || undefined,
    service: obj.service,
    preferredDate: obj.preferredDate,
    preferredTime: obj.preferredTime,
    message: obj.message || undefined,
    status: obj.status,
    staffNote: obj.staffNote || undefined,
    emailStatus: { staffNotified: !!obj.emailStatus?.staffNotified, patientAcked: !!obj.emailStatus?.patientAcked },
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

const KEY_RE = /^[A-Za-z0-9_.:-]{8,100}$/;

/** Defense in depth: never trust the header alone, even though the controller validates it. */
function usableKey(key) {
  return typeof key === 'string' && KEY_RE.test(key) ? key : undefined;
}

function assertObjectId(id) {
  if (!mongoose.isValidObjectId(id)) throw AppError.notFound('Appointment not found');
}

function recordFields(input, idempotencyKey) {
  const fields = {
    patientName: input.patientName,
    phone: input.phone,
    email: input.email || '',
    service: input.service,
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime,
    message: input.message || '',
    status: 'Pending',
  };
  if (idempotencyKey) fields.idempotencyKey = idempotencyKey;
  return fields;
}

async function persist(input, idempotencyKey) {
  return Appointment.create(recordFields(input, idempotencyKey));
}

/** Fire-and-observe notifications — the record stays saved even if a provider is down. */
async function notify(doc) {
  try {
    await sendEmail(staffNotificationFor(doc));
    doc.emailStatus.staffNotified = true;
  } catch (err) {
    logger.error('[appointments] staff notification failed', { error: err.message, id: String(doc._id) });
    doc.emailStatus.lastError = String(err.message).slice(0, 300);
  }

  if (config.email.patientAckEnabled && doc.email) {
    try {
      await sendEmail(patientAckFor(doc));
      doc.emailStatus.patientAcked = true;
    } catch (err) {
      logger.error('[appointments] patient ack failed', { error: err.message, id: String(doc._id) });
    }
  }

  await doc.save().catch((e) => logger.error('[appointments] emailStatus save failed', { error: e.message }));
}

/** Create a Pending request; idempotent on X-Idempotency-Key for the same patient. Never fails because of email. */
export async function createAppointment(input, idempotencyKey) {
  // Honeypot first: a bot that fills it must never reach a lookup that could
  // disclose an existing patient's record.
  if (input.website && input.website.trim() !== '') {
    logger.warn('[appointments] honeypot triggered — dropping silently');
    return {
      appointment: {
        id: 'received',
        status: 'Pending',
        patientName: input.patientName,
        service: input.service,
        preferredDate: input.preferredDate,
        preferredTime: input.preferredTime,
        createdAt: new Date().toISOString(),
      },
      deduped: false,
    };
  }

  const key = usableKey(idempotencyKey);

  if (key) {
    const existing = await Appointment.findOne({ idempotencyKey: key });
    if (existing) {
      // A retry belongs to the same patient. A different phone number must never
      // receive this record (it contains name, phone, email and the note), and
      // its request is still saved — just without a key it does not own.
      if (existing.phone === input.phone) {
        return { appointment: publicView(existing), deduped: true };
      }
      const doc = await persist(input, undefined);
      await notify(doc);
      return { appointment: publicView(doc), deduped: false };
    }
  }

  let doc;
  try {
    doc = await persist(input, key);
  } catch (err) {
    // Two concurrent retries can race the unique index; resolve like a retry.
    if (err?.code === 11000 && key) {
      const existing = await Appointment.findOne({ idempotencyKey: key, phone: input.phone });
      if (existing) return { appointment: publicView(existing), deduped: true };
      doc = await persist(input, undefined);
    } else {
      throw err;
    }
  }

  await notify(doc);
  return { appointment: publicView(doc), deduped: false };
}

const ALLOWED_TRANSITIONS = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Completed', 'Cancelled'],
  Cancelled: [],
  Completed: [],
};

export async function updateAppointmentStatus(id, { status, staffNote }) {
  assertObjectId(id);
  const doc = await Appointment.findById(id).select('+staffNote +emailStatus.lastError');
  if (!doc) throw AppError.notFound('Appointment not found');
  const next = ALLOWED_TRANSITIONS[doc.status] || [];
  if (status && !next.includes(status)) {
    throw AppError.badRequest(`Cannot move status from ${doc.status} to ${status}`);
  }
  if (status) doc.status = status;
  if (staffNote !== undefined) doc.staffNote = staffNote;
  await doc.save();
  return adminView(doc);
}

export async function listAppointments({ page, limit, status, date, search }) {
  const filter = {};
  if (status) filter.status = status;
  if (date) filter.preferredDate = date;
  if (search) {
    // Bounded, indexed-friendly-ish search on the fields staff actually need
    filter.$or = [
      { patientName: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { phone: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { service: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    ];
  }
  const [total, docs] = await Promise.all([
    Appointment.countDocuments(filter),
    // staffNote is select:false (admin-only); this is the admin list, so include it.
    Appointment.find(filter).select('+staffNote').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
  ]);
  return { items: docs.map(adminView), total };
}

export async function getAppointment(id) {
  assertObjectId(id);
  const doc = await Appointment.findById(id).select('+staffNote');
  if (!doc) throw AppError.notFound('Appointment not found');
  return adminView(doc);
}
