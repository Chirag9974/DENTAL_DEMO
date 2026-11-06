import mongoose from 'mongoose';

export const APPOINTMENT_STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];

const appointmentSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 25 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, default: '' },
    service: { type: String, required: true, trim: true, maxlength: 80 },
    preferredDate: { type: String, required: true, trim: true }, // YYYY-MM-DD (validated in zod)
    preferredTime: { type: String, required: true, trim: true }, // HH:MM or "Morning" etc.
    message: { type: String, trim: true, maxlength: 500, default: '' },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'Pending', index: true },
    staffNote: { type: String, trim: true, maxlength: 500, default: '', select: false }, // admin-only
    // Idempotency: frontend may send X-Idempotency-Key header; retries reuse the same record.
    idempotencyKey: { type: String, index: true, sparse: true, unique: true },
    emailStatus: {
      staffNotified: { type: Boolean, default: false },
      patientAcked: { type: Boolean, default: false },
      lastError: { type: String, default: '', select: false },
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ createdAt: -1 });
appointmentSchema.index({ status: 1, createdAt: -1 });

export const Appointment =
  mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
