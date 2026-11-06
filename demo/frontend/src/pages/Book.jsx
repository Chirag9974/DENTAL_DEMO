import { Link, useSearchParams } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { Icon, Blob } from '../components/Icon';
import BookingForm from '../components/BookingForm';
import { useClinic } from '../context/ClinicContext';
import { MAPS_URL } from '../data/content';

export default function Book() {
  const { clinic, services, status } = useClinic();
  const [params] = useSearchParams();
  const requested = params.get('service') || '';
  const matched = services.find((s) => s.title === requested || s.slug === requested);
  const tel = (clinic?.phone || '').replace(/[^\d+]/g, '');

  return (
    <>
      <header className="pagehead pagehead--compact">
        <Blob className="pagehead__blob" tone="mint" />
        <div className="shell pagehead__inner">
          <Reveal>
            <span className="eyebrow">Book an appointment</span>
            <h1 style={{ marginTop: 16 }}>
              Ask for a slot. <span className="gradient-text">We’ll confirm it.</span>
            </h1>
            <p className="lede">
              This sends a request, not a booking. The clinic reviews it and calls you back to lock the time — usually within
              the hour during {clinic?.hours || 'clinic hours'}.
            </p>
          </Reveal>
        </div>
      </header>

      <section className="section section--tight">
        <div className="shell bookpage">
          <Reveal className="bookpage__form">
            <div className="card card--flat">
              <h2 style={{ fontSize: '1.5rem' }}>Your request</h2>
              <p className="field-hint" style={{ marginTop: -6, marginBottom: 18 }}>
                Fields marked <span className="req">*</span> are required. Please keep medical details brief — share them in
                person.
              </p>
              {status === 'error' ? (
                <div className="alert alert-error">
                  <Icon name="close" size={20} />
                  <span>
                    <b>Booking API unreachable.</b> Start the backend (<code>cd backend &amp;&amp; npm run dev</code>) or call the
                    clinic directly.
                  </span>
                </div>
              ) : (
                <BookingForm defaultService={matched?.title || (status === 'ready' ? '' : requested)} />
              )}
            </div>
          </Reveal>

          <Reveal delay={0.12} className="bookpage__aside">
            <aside className="infocard">
              <h3>While you wait</h3>
              <p style={{ color: 'var(--ink-soft)' }}>
                Your request shows as <b>Pending</b> until a human confirms it — no auto-booked slots, no silent collisions.
              </p>
              <div className="info">
                <Icon name="pin" size={19} />
                <div>
                  <b>Address</b>
                  <a href={MAPS_URL} target="_blank" rel="noreferrer">
                    {clinic?.address || 'S-70, Sindhi Colony, Jawahar Nagar, Jaipur, Rajasthan 302004'}
                  </a>
                </div>
              </div>
              <div className="info">
                <Icon name="clock" size={19} />
                <div>
                  <b>Hours</b>
                  <span>{clinic?.hours || 'Mon–Sat 10:00–20:00 · Sun 10:00–14:00'}</span>
                </div>
              </div>
              {tel && (
                <div className="info">
                  <Icon name="phone" size={19} />
                  <div>
                    <b>Phone</b>
                    <a href={`tel:${tel}`}>{clinic.phone}</a>
                  </div>
                </div>
              )}
              {clinic?.whatsappUrl && (
                <a className="btn btn-brand btn-block" href={clinic.whatsappUrl} target="_blank" rel="noreferrer">
                  <Icon name="whatsapp" size={18} /> Message on WhatsApp
                </a>
              )}
              <div className="info info--soft">
                <Icon name="shield" size={19} />
                <div>
                  <b>Privacy</b>
                  <span>Only your name, contact and preferred slot are stored — nothing else is collected online.</span>
                </div>
              </div>
              <Link className="link-arrow" to="/treatments" style={{ marginTop: 4 }}>
                Browse treatments first <Icon name="arrow" size={17} />
              </Link>
            </aside>
          </Reveal>
        </div>
      </section>
    </>
  );
}
