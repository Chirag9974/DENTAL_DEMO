import { Clinic } from '../models/Clinic.js';
import { Service } from '../models/Service.js';
import { config } from '../config/env.js';

/** Only ever emit an http(s) link — a stored javascript:/data: URL must not become an href. */
function safeHttpUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value));
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function whatsappLink(number, text) {
  if (!number) return '';
  const digits = String(number).replace(/\D/g, '');
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${q}`;
}

/** Public clinic profile: DB row wins, env fallback keeps the demo working pre-seed. */
export async function getPublicClinic() {
  const doc = await Clinic.findOne({ isPublished: true }).sort({ updatedAt: -1 });
  const number = doc?.whatsappNumber || config.clinicFallback.whatsappNumber;
  return {
    name: doc?.name || 'Demo Dental Care',
    tagline: doc?.tagline || 'Gentle, modern dentistry for the whole family.',
    address: doc?.address || config.clinicFallback.address,
    phone: doc?.phone || '',
    email: doc?.email || '',
    hours: doc?.hours || 'Mon–Sat · 9:00–19:00',
    mapUrl: safeHttpUrl(doc?.mapUrl),
    whatsappUrl: whatsappLink(number, 'Hello, I would like to book an appointment.'),
  };
}

/** Public treatment list — only active services, no internal fields. */
export async function getPublicServices() {
  const docs = await Service.find({ isActive: true })
    .sort({ sortOrder: 1, title: 1 })
    .select('title slug description durationMinutes priceFrom');
  return docs.map((s) => ({
    title: s.title,
    slug: s.slug,
    description: s.description,
    durationMinutes: s.durationMinutes,
    priceFrom: s.priceFrom,
  }));
}
