/**
 * Seed script: `npm run seed`
 * Idempotent — safe to re-run. Creates/updates:
 *  - admin user from ADMIN_* env vars (fails if default password still set in prod)
 *  - one published clinic profile
 *  - a starter set of dental services
 */
import 'dotenv/config.js';
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from './config/db.js';
import { config } from './config/env.js';
import { AdminUser } from './models/AdminUser.js';
import { Clinic } from './models/Clinic.js';
import { Service } from './models/Service.js';

// Services mirror the real clinic's published offerings (Invisalign/orthodontic &
// implant centre, Jaipur). priceFrom values are demo placeholders — the clinic
// quotes exact prices after an in-chair assessment.
const SERVICES = [
  { title: 'Invisalign & Clear Aligners', slug: 'invisalign-clear-aligners', description: 'Digitally planned clear aligners that straighten teeth with no metal — scans, reviews and refinements included.', durationMinutes: 45, priceFrom: 150000, sortOrder: 1 },
  { title: 'Braces & Orthodontics', slug: 'braces-orthodontics', description: 'Metal, ceramic and self-ligating braces for teens and adults, planned for fewer clinic visits.', durationMinutes: 45, priceFrom: 35000, sortOrder: 2 },
  { title: 'Dental Implants', slug: 'dental-implants', description: 'Single or multiple missing teeth replaced with titanium implants and tooth-coloured crowns.', durationMinutes: 90, priceFrom: 30000, sortOrder: 3 },
  { title: 'Root Canal Treatment', slug: 'root-canal-treatment', description: 'Painless, usually single-visit rotary root canal — most patients feel nothing at all.', durationMinutes: 60, priceFrom: 4999, sortOrder: 4 },
  { title: 'Teeth Whitening', slug: 'teeth-whitening', description: 'Clinic-grade whitening for a visibly brighter smile in a single sitting.', durationMinutes: 60, priceFrom: 7999, sortOrder: 5 },
  { title: 'Smile Design & Veneers', slug: 'smile-design-veneers', description: 'Digital smile preview plus e-max and zirconia veneers for shape, gap and colour corrections.', durationMinutes: 60, priceFrom: 15000, sortOrder: 6 },
  { title: 'General Check-up & Cleaning', slug: 'general-checkup-cleaning', description: 'Full oral examination, scaling and polishing — the six-monthly reset your teeth want.', durationMinutes: 30, priceFrom: 499, sortOrder: 7 },
  { title: 'Tooth-coloured Fillings', slug: 'tooth-filling', description: 'Composite restorations for cavities and small chips, shade-matched to your natural enamel.', durationMinutes: 30, priceFrom: 999, sortOrder: 8 },
];

async function main() {
  if (config.isProd) {
    if (config.adminSeed.password === 'ChangeMe123!') {
      throw new Error('Refusing to seed with the default ADMIN_PASSWORD in production. Set a strong one first.');
    }
    if (!config.adminSeed.allowWeakPassword && config.adminSeed.password.length < 12) {
      // Demo deploys can set ALLOW_WEAK_ADMIN_PASSWORD=true to skip this rule.
      throw new Error(
        'ADMIN_PASSWORD must be at least 12 characters in production ' +
        '(or set ALLOW_WEAK_ADMIN_PASSWORD=true for a demo deployment).'
      );
    }
    if (config.adminSeed.allowWeakPassword) {
      console.warn('[seed] ALLOW_WEAK_ADMIN_PASSWORD=true — skipping the 12-character minimum. Demo only; remove it before a real launch.');
    }
  }

  await connectDb();

  const passwordHash = await bcrypt.hash(config.adminSeed.password, 12);
  await AdminUser.findOneAndUpdate(
    { email: config.adminSeed.email.toLowerCase() },
    { name: config.adminSeed.name, email: config.adminSeed.email.toLowerCase(), passwordHash, role: 'admin', active: true },
    { upsert: true }
  );
  console.log(`[seed] admin ready: ${config.adminSeed.email}`);

  // Real clinic profile (from the Google Maps listing supplied for this demo).
  // Unpublish anything else first so GET /api/clinic always serves this one.
  await Clinic.updateMany({}, { isPublished: false });
  await Clinic.findOneAndUpdate(
    { name: 'Tooth Care Dental Clinic' },
    {
      name: 'Tooth Care Dental Clinic',
      tagline: 'An Invisalign, Orthodontic and Implant Centre in Jaipur.',
      address: config.clinicFallback.address ||
        'Plot No. S-70, near Shivji Mandir, Sarvanand Park, Sindhi Colony, Jawahar Nagar, Jaipur, Rajasthan 302004',
      phone: '+91 97823 77710',
      email: '',
      hours: 'Mon–Sat · 10:00–20:00 · Sun · 10:00–14:00',
      mapUrl: 'https://maps.app.goo.gl/sToTpFbKWAs2JEod6',
      whatsappNumber: config.clinicFallback.whatsappNumber || '919782377710',
      isPublished: true,
    },
    { upsert: true }
  );
  console.log('[seed] clinic profile ready');

  for (const s of SERVICES) {
    await Service.findOneAndUpdate({ slug: s.slug }, { ...s, isActive: true }, { upsert: true });
  }
  console.log(`[seed] ${SERVICES.length} services ready`);

  await disconnectDb();
  console.log('[seed] done');
}

main().catch(async (err) => {
  console.error('[seed] failed:', err.message);
  await disconnectDb().catch(() => {});
  process.exit(1);
});
