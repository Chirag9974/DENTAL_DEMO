import mongoose from 'mongoose';

// Single published clinic profile. Keep one active doc; seeding ensures it.
// Future: add `key`/multi-location support without breaking GET /api/clinic.
const clinicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    tagline: { type: String, trim: true, maxlength: 200, default: '' },
    address: { type: String, trim: true, maxlength: 250, default: '' },
    phone: { type: String, trim: true, maxlength: 25, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 120, default: '' },
    hours: { type: String, trim: true, maxlength: 500, default: '' },
    mapUrl: { type: String, trim: true, maxlength: 500, default: '' },
    whatsappNumber: { type: String, trim: true, maxlength: 25, default: '' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Clinic = mongoose.models.Clinic || mongoose.model('Clinic', clinicSchema);
