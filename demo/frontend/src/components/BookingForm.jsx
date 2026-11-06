import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../lib/api';
import { useClinic } from '../context/ClinicContext';
import { useToast } from './Toast';
import { Icon } from './Icon';
import { TREATMENT_ICONS } from '../data/content';

const PHONE_RE = /^[+\d][\d\s\-()]*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SLOTS = [
  { group: 'Morning · 10:00 – 12:30', times: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30'] },
  { group: 'Afternoon · 13:00 – 16:30', times: ['13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'] },
  { group: 'Evening · 17:00 – 19:30', times: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30'] },
  { group: "I'm flexible", times: ['Morning', 'Afternoon', 'Evening'] },
];

const EMPTY = {
  patientName: '',
  phone: '',
  email: '',
  service: '',
  preferredDate: '',
  preferredTime: '',
  message: '',
  website: '', // honeypot — must stay empty
};

function validate(values) {
  const errors = {};
  if (values.patientName.trim().length < 2) errors.patientName = 'Please tell us your name (2+ characters).';
  if (!PHONE_RE.test(values.phone.trim()) || values.phone.trim().length < 7)
    errors.phone = 'Enter a valid phone number so the clinic can call you.';
  if (values.email.trim() && !EMAIL_RE.test(values.email.trim())) errors.email = 'That email address looks off.';
  if (!values.service) errors.service = 'Pick the treatment you need.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.preferredDate)) errors.preferredDate = 'Choose a preferred date.';
  if (!values.preferredTime) errors.preferredTime = 'Choose a time (or “flexible”).';
  if (values.message.length > 500) errors.message = 'Keep the note under 500 characters.';
  return errors;
}

/**
 * Appointment request form. Mirrors the backend contract:
 *  - POST /api/appointments with a strict body (+ hidden honeypot `website`)
 *  - X-Idempotency-Key so a double-click never creates a duplicate
 *  - request defaults to Pending; we never promise a confirmed time
 */
export default function BookingForm({ defaultService = '', compact = false }) {
  const { services, clinic } = useClinic();
  const toast = useToast();
  const idemKey = useRef(null);
  if (!idemKey.current && typeof crypto !== 'undefined' && crypto.randomUUID) {
    idemKey.current = crypto.randomUUID();
  }

  const [values, setValues] = useState({ ...EMPTY, service: defaultService });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null); // { id, ... }

  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function set(field, value) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setServerError(null);
    const found = validate(values);
    setErrors(Object.fromEntries(Object.entries(found).filter(([, v]) => v)));
    if (Object.keys(found).length) {
      const firstKey = Object.keys(found)[0];
      document.getElementById(`bf-${firstKey}`)?.focus();
      return;
    }

    setSending(true);
    try {
      const res = await api.bookAppointment(
        {
          patientName: values.patientName.trim(),
          phone: values.phone.trim(),
          email: values.email.trim(),
          service: values.service,
          preferredDate: values.preferredDate,
          preferredTime: values.preferredTime,
          message: values.message.trim(),
          website: values.website,
        },
        idemKey.current || undefined
      );
      setDone(res);
      toast('Request sent — the clinic will call to confirm', 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = err.fieldErrors();
        setErrors((prev) => ({ ...prev, ...fields }));
        setServerError(err.message);
        if (err.status === 429) setServerError('Too many requests from this device — please wait a few minutes and try again.');
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setSending(false);
    }
  }

  function reset() {
    idemKey.current = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null;
    setValues({ ...EMPTY, service: defaultService });
    setErrors({});
    setServerError(null);
    setDone(null);
  }

  /* ---------- success state ---------- */
  if (done) {
    return (
      <div className="booking__success">
        <div className="booking__check">
          <Icon name="check" size={38} />
        </div>
        <h3>Request received{done.id && done.id !== 'received' ? '' : ''}</h3>
        <p className="lede" style={{ marginInline: 'auto' }}>
          Your reference is <b className="ref">{done.id === 'received' ? 'sent' : `#${String(done.id).slice(-6).toUpperCase()}`}</b>. The
          slot you asked for is <b>{values.preferredDate}</b> at <b>{values.preferredTime}</b>.
        </p>
        <div className="alert alert-info" style={{ maxWidth: 520, margin: '6px auto 18px' }}>
          <Icon name="clock" size={20} />
          <span>
            <b>Status: Pending.</b> A member of the clinic will call {values.phone} to confirm the exact time before you travel —
            nothing is booked until they do.
          </span>
        </div>
        <div className="booking__success-actions">
          <button type="button" className="btn btn-brand" onClick={reset}>
            Send another request
          </button>
          {clinic?.whatsappUrl && (
            <a className="btn btn-ghost" href={clinic.whatsappUrl} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" size={18} /> WhatsApp instead
            </a>
          )}
          <Link className="btn btn-ghost" to="/">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- form ---------- */
  return (
    <form className="booking" onSubmit={onSubmit} noValidate>
      {serverError && (
        <div className="alert alert-error" role="alert">
          <Icon name="close" size={20} />
          <span>{serverError}</span>
        </div>
      )}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="bf-patientName">
            Your name <span className="req">*</span>
          </label>
          <input
            id="bf-patientName"
            className={`input ${errors.patientName ? 'invalid' : ''}`}
            value={values.patientName}
            onChange={(e) => set('patientName', e.target.value)}
            placeholder="e.g. Ananya Sharma"
            autoComplete="name"
            aria-invalid={!!errors.patientName}
          />
          {errors.patientName && <span className="field-error">{errors.patientName}</span>}
        </div>

        <div className="field">
          <label htmlFor="bf-phone">
            Phone <span className="req">*</span>
          </label>
          <input
            id="bf-phone"
            className={`input ${errors.phone ? 'invalid' : ''}`}
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="98xxxxxxxx"
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
          />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>

        <div className="field span-2">
          <label htmlFor="bf-email">Email (optional)</label>
          <input
            id="bf-email"
            className={`input ${errors.email ? 'invalid' : ''}`}
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="bf-service">
            Treatment <span className="req">*</span>
          </label>
          <select
            id="bf-service"
            className={`input ${errors.service ? 'invalid' : ''}`}
            value={values.service}
            onChange={(e) => set('service', e.target.value)}
            aria-invalid={!!errors.service}
          >
            <option value="">Choose a treatment…</option>
            {services.map((s) => (
              <option key={s.slug} value={s.title}>
                {s.title}
              </option>
            ))}
            {!services.length && <option value="Consultation">Consultation</option>}
          </select>
          {errors.service && <span className="field-error">{errors.service}</span>}
        </div>

        <div className="field">
          <label htmlFor="bf-preferredDate">
            Preferred date <span className="req">*</span>
          </label>
          <input
            id="bf-preferredDate"
            type="date"
            min={minDate}
            className={`input ${errors.preferredDate ? 'invalid' : ''}`}
            value={values.preferredDate}
            onChange={(e) => set('preferredDate', e.target.value)}
            aria-invalid={!!errors.preferredDate}
          />
          {errors.preferredDate && <span className="field-error">{errors.preferredDate}</span>}
        </div>

        <div className="field span-2">
          <label htmlFor="bf-preferredTime">
            Preferred time <span className="req">*</span>
          </label>
          <select
            id="bf-preferredTime"
            className={`input ${errors.preferredTime ? 'invalid' : ''}`}
            value={values.preferredTime}
            onChange={(e) => set('preferredTime', e.target.value)}
            aria-invalid={!!errors.preferredTime}
          >
            <option value="">Choose a slot…</option>
            {SLOTS.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.times.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {errors.preferredTime && <span className="field-error">{errors.preferredTime}</span>}
        </div>

        {!compact && (
          <div className="field span-2">
            <label htmlFor="bf-message">Anything we should know?</label>
            <textarea
              id="bf-message"
              className={`input ${errors.message ? 'invalid' : ''}`}
              value={values.message}
              onChange={(e) => set('message', e.target.value)}
              placeholder="Sensitivity, past treatment, dental anxiety… please keep medical details brief here."
              maxLength={500}
            />
            <span className="field-hint">
              Please don’t share detailed medical history in this box — save it for the chair. ({500 - values.message.length} left)
            </span>
            {errors.message && <span className="field-error">{errors.message}</span>}
          </div>
        )}

        {/* honeypot: real humans never see or fill this */}
        <div className="honeypot" aria-hidden="true">
          <label htmlFor="bf-website">Website</label>
          <input id="bf-website" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set('website', e.target.value)} />
        </div>
      </div>

      <div className="booking__foot">
        <button type="submit" className="btn btn-brand btn-lg" disabled={sending}>
          {sending ? (
            <>
              <span className="spinner" /> Sending…
            </>
          ) : (
            <>
              Request appointment <span className="arr">→</span>
            </>
          )}
        </button>
        <p className="booking__note">
          <Icon name="shield" size={16} /> Starts as <b>Pending</b> — the clinic calls to confirm. No account, no payment online.
        </p>
      </div>

      {!compact && services.length > 0 && (
        <div className="booking__quick">
          {services.slice(0, 6).map((s) => {
            const IconName = TREATMENT_ICONS[s.slug] || 'tooth';
            return (
              <button
                key={s.slug}
                type="button"
                className={`quickchip ${values.service === s.title ? 'is-on' : ''}`}
                onClick={() => set('service', s.title)}
              >
                <Icon name={IconName} size={16} /> {s.title}
              </button>
            );
          })}
        </div>
      )}
    </form>
  );
}
