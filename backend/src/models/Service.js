import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    durationMinutes: { type: Number, min: 5, max: 480, default: 30 },
    priceFrom: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

serviceSchema.index({ isActive: 1, sortOrder: 1 });

export const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);
