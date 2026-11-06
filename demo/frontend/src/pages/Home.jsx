import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { Icon, HeroArt, DoctorArt, Blob } from '../components/Icon';
import BookingForm from '../components/BookingForm';
import Gallery from '../components/Gallery';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { useClinic } from '../context/ClinicContext';
import { formatPrice } from '../lib/format';
import { DOCTOR, FAQS, HERO_CHIPS, MAPS_URL, REVIEWS, STATS, STEPS, TREATMENT_ICONS } from '../data/content';

function ApiBanner() {
  const { status, error, reload } = useClinic();
  if (status !== 'error') return null;
  return (
    <div className="shell api-banner">
      <div className="alert alert-error">
        <Icon name="close" size={20} />
        <span>
          <b>Live clinic data unavailable.</b> {error?.message || 'The API did not respond.'} Start the backend
          (<code>cd backend &amp;&amp; npm run dev</code>) and <button type="button" onClick={reload}>retry</button>.
        </span>
      </div>
    </div>
  );
}

function Hero() {
  const { clinic } = useClinic();
  const tel = (clinic?.phone || '').replace(/[^\d+]/g, '');

  return (
    <section className="hero">
      <div className="hero__glow hero__glow--1" aria-hidden="true" />
      <div className="hero__glow hero__glow--2" aria-hidden="true" />
      <div className="shell hero__inner">
        <div className="hero__copy">
          <Reveal className="hero__eyebrow-row">
            <span className="eyebrow">
              <Icon name="pin" size={14} /> {clinic?.address ? clinic.address.split(',').slice(-2).join(',').trim() : 'Sarvanand Park, Jaipur'}
            </span>
            <span className="eyebrow warm">Invisalign · Braces · Implants</span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1>
              Dentistry that
              <br />
              makes you <span className="gradient-text">grin</span> first,
              <br />
              wince never.
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="lede">
              Tooth Care Dental Clinic is Jaipur’s orthodontic, Invisalign and implant centre — digital planning, painless
              technique and a team that actually picks up the phone to confirm your visit.
            </p>
          </Reveal>

          <Reveal delay={0.24} className="hero__ctas">
            <Link to="/book" className="btn btn-brand btn-lg">
              Book an appointment <span className="arr">→</span>
            </Link>
            {tel ? (
              <a className="btn btn-ghost btn-lg" href={`tel:${tel}`}>
                <Icon name="phone" size={18} /> {clinic.phone}
              </a>
            ) : (
              <a className="btn btn-ghost btn-lg" href={MAPS_URL} target="_blank" rel="noreferrer">
                <Icon name="pin" size={18} /> Find us
              </a>
            )}
          </Reveal>

          <Reveal delay={0.32} className="hero__chips">
            {HERO_CHIPS.map((c) => (
              <span key={c.text} className={`chip chip--${c.tone}`}>
                {c.text}
              </span>
            ))}
          </Reveal>
        </div>

        <div className="hero__art" aria-hidden="false">
          <div className="hero__float hero__float--rating">
            <span className="stars">
              {[0, 1, 2, 3, 4].map((i) => (
                <Icon key={i} name="star" size={15} />
              ))}
            </span>
            <b>5.0 on Google</b>
            <small>81+ patient reviews</small>
          </div>
          <div className="hero__float hero__float--hours">
            <Icon name="clock" size={18} />
            <div>
              <b>Open today till 8 PM</b>
              <small>Mon–Sat 10–8 · Sun 10–2</small>
            </div>
          </div>
          <div className="hero__float hero__float--doctor">
            <span className="hero__float-avatar">BK</span>
            <div>
              <b>{DOCTOR.name}</b>
              <small>Orthodontist &amp; Implantologist</small>
            </div>
          </div>
          <HeroArt className="hero__svg" />
        </div>
      </div>

      <div className="shell">
        <div className="marquee" aria-hidden="true">
          <div className="marquee__track">
            <span>Painless root canals</span>
            <span>Clear aligners</span>
            <span>Zirconia crowns</span>
            <span>Kids’ dentistry</span>
            <span>Same-day smiles</span>
            <span>Implants</span>
            <span>Painless root canals</span>
            <span>Clear aligners</span>
            <span>Zirconia crowns</span>
            <span>Kids’ dentistry</span>
            <span>Same-day smiles</span>
            <span>Implants</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="section section--tight">
      <div className="shell">
        <div className="stat-row">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.07}>
              <AnimatedNumber {...s} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Treatments() {
  const { services, status } = useClinic();

  return (
    <section className="section treatments">
      <Blob className="treatments__blob" tone="mint" />
      <div className="shell">
        <div className="section-head">
          <Reveal>
            <span className="eyebrow">What we do</span>
            <h2 style={{ marginTop: 14 }}>
              Treatments with a <span className="gradient-text">plan</span>, not a pitch.
            </h2>
            <p className="lede">Digital scans, honest timelines, printed prices. Every treatment below starts with a conversation.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <Link to="/treatments" className="btn btn-ghost">
              All treatments <span className="arr">→</span>
            </Link>
          </Reveal>
        </div>

        <div className="bento">
          {status === 'loading' &&
            Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton bento__skel" style={{ minHeight: 190 }} />)}

          {services.map((s, i) => {
            const IconName = TREATMENT_ICONS[s.slug] || 'tooth';
            const featured = i === 0 || i === 3;
            return (
              <Reveal key={s.slug} delay={(i % 3) * 0.08} className={`bento__cell ${featured ? 'bento__cell--wide' : ''}`}>
                <Link to={`/treatments#${s.slug}`} className={`tcard ${featured ? 'tcard--feature' : ''}`}>
                  <span className={`tcard__icon tcard__icon--${i % 4}`}>
                    <Icon name={IconName} size={26} />
                  </span>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                  <div className="tcard__meta">
                    {s.priceFrom > 0 && <span className="tcard__price">from {formatPrice(s.priceFrom)}</span>}
                    <span className="tcard__dur">
                      <Icon name="clock" size={14} /> {s.durationMinutes} min
                    </span>
                  </div>
                  <span className="tcard__go" aria-hidden="true">
                    <Icon name="arrow" size={18} />
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Steps() {
  return (
    <section className="section steps">
      <div className="shell">
        <div className="section-head">
          <Reveal>
            <span className="eyebrow warm">How booking works</span>
            <h2 style={{ marginTop: 14 }}>No instant confirmations. On purpose.</h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="lede" style={{ maxWidth: '46ch' }}>
              Online calendars double-book patients. Here, your request is reviewed by a human and confirmed by phone —
              usually within the hour during clinic time.
            </p>
          </Reveal>
        </div>

        <ol className="steps__list">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 0.1} className="step">
              <span className="step__num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

function DoctorTeaser() {
  return (
    <section className="section doctor">
      <div className="shell doctor__inner">
        <Reveal className="doctor__art">
          <DoctorArt />
          <div className="doctor__badge">
            <span className="stars">
              {[0, 1, 2, 3, 4].map((i) => (
                <Icon key={i} name="star" size={14} />
              ))}
            </span>
            <b>“Treatment was painless and smooth.”</b>
            <small>— root canal patient, Google review</small>
          </div>
        </Reveal>

        <Reveal delay={0.12} className="doctor__copy">
          <span className="eyebrow">Meet your dentist</span>
          <h2 style={{ marginTop: 14 }}>
            {DOCTOR.name}
            <span className="doctor__role">{DOCTOR.role}</span>
          </h2>
          <ul className="ticks">
            {DOCTOR.facts.map((f) => (
              <li key={f}>
                <span className="tick">
                  <Icon name="check" size={14} />
                </span>
                {f}
              </li>
            ))}
          </ul>
          <blockquote className="doctor__quote">“{DOCTOR.quote}”</blockquote>
          <Link to="/about" className="btn btn-warm">
            Inside the clinic <span className="arr">→</span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function Reviews() {
  return (
    <section className="section reviews">
      <div className="shell">
        <div className="section-head">
          <Reveal>
            <span className="eyebrow">Word of mouth</span>
            <h2 style={{ marginTop: 14 }}>81+ reviews. Average: perfect.</h2>
          </Reveal>
        </div>
        <div className="reviews__row">
          {REVIEWS.map((r, i) => (
            <Reveal key={i} delay={i * 0.09}>
              <figure className="review">
                <span className="review__mark">“</span>
                <blockquote>{r.text}</blockquote>
                <figcaption>
                  <span className="review__stars">
                    {Array.from({ length: r.stars }).map((_, s) => (
                      <Icon key={s} name="star" size={14} />
                    ))}
                  </span>
                  <b>{r.author}</b>
                  <small>{r.source}</small>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section faq">
      <div className="shell faq__inner">
        <Reveal className="faq__head">
          <span className="eyebrow">Good to know</span>
          <h2 style={{ marginTop: 14 }}>Questions, answered before you ask.</h2>
          <p className="lede">Anything else — call the clinic or send a request; a human replies either way.</p>
        </Reveal>
        <div className="faq__list">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 0.06}>
                <div className={`faq__item ${isOpen ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="faq__q"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span>{item.q}</span>
                    <span className="faq__plus" aria-hidden="true">
                      +
                    </span>
                  </button>
                  <div className="faq__a">
                    <div className="faq__a-inner">
                      <p>{item.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BookBand() {
  const { status } = useClinic();
  return (
    <section className="section bookband" id="book">
      <div className="bookband__glow" aria-hidden="true" />
      <div className="shell bookband__inner">
        <Reveal className="bookband__copy">
          <span className="eyebrow dark">Request a visit</span>
          <h2 style={{ marginTop: 14, color: '#fff' }}>
            Thirty seconds now,
            <br />
            a confirmed chair later.
          </h2>
          <p style={{ color: '#a9c8d6' }}>
            Send your preferred day and time. The clinic reviews every request personally and calls to confirm — pending
            until then, never double-booked.
          </p>
          <ul className="bookband__points">
            <li>
              <Icon name="check" size={16} /> No online payment or account
            </li>
            <li>
              <Icon name="check" size={16} /> Call-back during clinic hours
            </li>
            <li>
              <Icon name="check" size={16} /> {status === 'ready' ? 'Live availability confirmed by staff' : 'Staff-confirmed slots'}
            </li>
          </ul>
        </Reveal>
        <Reveal delay={0.12} className="bookband__form">
          {status === 'error' ? (
            <div className="alert alert-error">
              <Icon name="close" size={20} />
              <span>The booking API is unreachable right now. Please call the clinic directly.</span>
            </div>
          ) : (
            <BookingForm compact />
          )}
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  const [params] = useSearchParams();

  useEffect(() => {
    if (params.get('book')) {
      document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [params]);

  return (
    <>
      <ApiBanner />
      <Hero />
      <Stats />
      <Treatments />
      <Steps />
      <DoctorTeaser />
      <Gallery />
      <Reviews />
      <Faq />
      <BookBand />
    </>
  );
}
