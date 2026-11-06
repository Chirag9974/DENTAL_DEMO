/**
 * Editorial content that has no backend model: the doctor bio, patient review
 * excerpts, FAQs and treatment icons. Factual details were collected from the
 * clinic's public listings (Google Maps place linked by the client, the clinic's
 * Instagram account and directory listings).
 * Clinical/service data (clinic profile + treatments) always comes from the API.
 */export const MAPS_URL =
  'https://maps.app.goo.gl/sToTpFbKWAs2JEod6';

/** Second contact line published by the clinic (its own site + Instagram). */
export const SECOND_PHONE = '+91 79765 45502';

/**
 * Real photos of the clinic, downloaded from the Google-hosted images the
 * clinic itself embeds on its site (lh3.googleusercontent.com, the same
 * photos shown on its Google Maps listing). Stored locally in public/images
 * so the site never hotlinks.
 */
export const GALLERY = [
  {
    src: '/images/clinic-01.jpg',
    alt: 'Inside Tooth Care Dental Clinic, Jaipur — treatment area',
    caption: 'The clinic floor patients see on Maps',
    note: 'Photo via the clinic’s Google listing',
    ratio: 'landscape',
  },
  {
    src: '/images/clinic-02.jpg',
    alt: 'Tooth Care Dental Clinic, Jaipur — treatment room',
    caption: 'Where the chair-side work happens',
    note: 'Photo via the clinic’s Google listing',
    ratio: 'portrait',
  },
];

export const INSTAGRAM_URL = 'https://www.instagram.com/toothcaredentalclinicjaipur/';

export const DOCTOR = {
  name: 'Dr. Bhupinder Kaur',
  role: 'Orthodontist & Implantologist — founder, Tooth Care Dental Clinic',
  facts: [
    'Postgraduate in orthodontics (Dr. R. Ahmed Dental College, Kolkata)',
    'Senior lecturer, Mahatma Gandhi Dental College & Hospital, Jaipur',
    'Certified Invisalign provider — clear aligners, braces and implant dentistry',
    'Known among patients for painless, single-visit treatment',
  ],
  quote:
    'Straight teeth are the easy part. My job is making sure you never dread the chair to get them.',
};

export const REVIEWS = [
  {
    text: 'We had a wonderful experience for my daughter’s dental check-up and cavity treatment. The clinic is spotless and the staff explained every step.',
    author: 'Parent of a young patient',
    source: 'Google review',
    stars: 5,
  },
  {
    text: 'The doctors are extremely professional, knowledgeable, and truly care about their patients.',
    author: 'Verified patient',
    source: 'Google review',
    stars: 5,
  },
  {
    text: 'I underwent RCT and a zirconia crown — the treatment was painless and smooth from start to finish.',
    author: 'Root canal patient',
    source: 'Google review',
    stars: 5,
  },
];

export const STATS = [
  { value: '5.0', label: 'Google rating', suffix: '★', countTo: 5, decimals: 1 },
  { value: '86', label: 'Google reviews', suffix: '+', countTo: 86 },
  { value: '2', label: 'Phone lines, 7 days', countTo: 2 },
  { value: '10', label: 'Doors open every day', suffix: ' AM', countTo: 10 },
];

export const STEPS = [
  {
    title: 'Send a request',
    text: 'Pick a treatment and a slot that suits you. It takes about 30 seconds — no account needed.',
  },
  {
    title: 'We call you back',
    text: 'Every request starts as pending. The clinic calls to confirm the exact time before you travel.',
  },
  {
    title: 'Sit down, smile up',
    text: 'Arrive to a confirmed slot. Your file is ready, your dentist is briefed, nothing is rushed.',
  },
];

export const FAQS = [
  {
    q: 'Is my booking confirmed the moment I submit the form?',
    a: 'Not yet — your request lands as “pending” and the clinic calls you to lock the exact time. This keeps double-bookings and surprise waits out of your day.',
  },
  {
    q: 'Does Invisalign really work for adults?',
    a: 'Yes. Clear aligners are the clinic’s core speciality: mild crowding to complex bites, planned digitally and reviewed in person every few weeks.',
  },
  {
    q: 'Will a root canal hurt?',
    a: 'Modern rotary endodontics with proper anaesthesia is routinely described by patients as painless. Most single-visit root canals finish within an hour.',
  },
  {
    q: 'What should I bring to my first visit?',
    a: 'Just yourself and any old X-rays or prescriptions if you have them. Please don’t share detailed medical history in the form’s message box — save that for the chair.',
  },
];

/** Fallback treatment icons keyed by slug; unknown slugs get the tooth icon. */
export const TREATMENT_ICONS = {
  'invisalign-clear-aligners': 'aligner',
  'braces-orthodontics': 'braces',
  'dental-implants': 'implant',
  'root-canal-treatment': 'rootcanal',
  'teeth-whitening': 'sparkle',
  'smile-design-veneers': 'smile',
  'general-checkup-cleaning': 'tooth',
  'tooth-filling': 'filling',
};

export const HERO_CHIPS = [
  { text: 'Invisalign® provider', tone: 'mint' },
  { text: 'Painless root canals', tone: 'butter' },
  { text: 'Same-day appointments', tone: 'coral' },
  { text: 'Sarvanand Park, Jaipur', tone: 'violet' },
];
