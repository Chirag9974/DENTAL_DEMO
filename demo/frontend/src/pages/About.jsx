import { Link } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { Icon, DoctorArt, Blob } from '../components/Icon';
import BookingForm from '../components/BookingForm';
import Gallery from '../components/Gallery';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { useClinic } from '../context/ClinicContext';
import { DOCTOR, MAPS_URL, REVIEWS, SECOND_PHONE, STATS } from '../data/content';

export default function About() {
  const { clinic } = useClinic();
  const tel = (clinic?.phone || '').replace(/[^\d+]/g, '');

  return (
    <>
      <header className="pagehead">
        <Blob className="pagehead__blob" tone="warm" />
        <div className="shell pagehead__inner">
          <Reveal>
            <span className="eyebrow warm">The clinic</span>
            <h1 style={{ marginTop: 16 }}>
              Small clinic.
              <br />
              <span className="gradient-text">Serious craft.</span>
            </h1>
            <p className="lede">
              Tooth Care Dental Clinic is an orthodontic, Invisalign and implant centre in Sarvanand Park, Jaipur — run by
              clinicians who still explain every step before they start.
            </p>
            <div className="hero__chips" style={{ marginTop: 18 }}>
              <a className="chip chip--mint" href={clinic?.whatsappUrl || '#'} target="_blank" rel="noreferrer">
                <Icon name="whatsapp" size={15} /> WhatsApp the clinic
              </a>
              <a className="chip" href={MAPS_URL} target="_blank" rel="noreferrer">
                <Icon name="pin" size={15} /> Directions
              </a>
              {tel && (
                <a className="chip chip--butter" href={`tel:${tel}`}>
                  <Icon name="phone" size={15} /> {clinic.phone}
                </a>
              )}
              {SECOND_PHONE && (
                <a className="chip" href={`tel:${SECOND_PHONE.replace(/[^\d+]/g, '')}`}>
                  <Icon name="phone" size={15} /> {SECOND_PHONE}
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </header>

      <section className="section section--tight">
        <div className="shell doctor__inner">
          <Reveal className="doctor__art">
            <DoctorArt />
            <div className="doctor__badge">
              <b>{DOCTOR.name}</b>
              <small>Orthodontist &amp; Implantologist</small>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="doctor__copy">
            <span className="eyebrow">Who treats you</span>
            <h2 style={{ marginTop: 14 }}>{DOCTOR.name}</h2>
            <p className="lede">{DOCTOR.role}</p>
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
          </Reveal>
        </div>
      </section>

      <section className="section section--tight">
        <div className="shell">
          <div className="stat-row">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.06}>
                <AnimatedNumber {...s} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <Gallery />

      <section className="section">
        <div className="shell values">
          <Reveal>
            <span className="eyebrow">How we work</span>
            <h2 style={{ marginTop: 14 }}>Three rules we don’t bend.</h2>
          </Reveal>
          <div className="values__grid">
            {[
              {
                icon: 'shield',
                title: 'No surprise costs',
                text: 'You get a written plan with the price before treatment begins. “From” prices on this site are honest floors, not hooks.',
                tone: 'mint',
              },
              {
                icon: 'sparkle',
                title: 'Painless is the baseline',
                text: 'Topical numbing, slow anaesthesia and rotary endodontics — most patients describe treatment as uneventful.',
                tone: 'coral',
              },
              {
                icon: 'clock',
                title: 'Time is respected',
                text: 'Requests are confirmed by phone instead of racing a calendar, so waiting rooms stay short and visits stay on schedule.',
                tone: 'violet',
              },
            ].map((v, i) => (
              <Reveal key={v.title} delay={i * 0.09}>
                <div className={`card value value--${v.tone}`}>
                  <span className="card__icon">
                    <Icon name={v.icon} size={26} />
                  </span>
                  <h3>{v.title}</h3>
                  <p style={{ margin: 0, color: 'var(--ink-soft)' }}>{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="shell">
          <div className="section-head">
            <Reveal>
              <span className="eyebrow">In their words</span>
              <h2 style={{ marginTop: 14 }}>Patients, unedited.</h2>
            </Reveal>
          </div>
          <div className="reviews__row">
            {REVIEWS.map((r, i) => (
              <Reveal key={i} delay={i * 0.08}>
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

      <section className="section bookband" id="book">
        <div className="bookband__glow" aria-hidden="true" />
        <div className="shell bookband__inner">
          <Reveal className="bookband__copy">
            <span className="eyebrow dark">Say hello</span>
            <h2 style={{ marginTop: 14, color: '#fff' }}>First visit starts here.</h2>
            <p style={{ color: '#a9c8d6' }}>
              Tell us what’s bothering you and when you’re free. The clinic calls back to confirm — {clinic?.hours || 'Mon–Sat 10–8'}.
            </p>
          </Reveal>
          <Reveal delay={0.12} className="bookband__form">
            <BookingForm compact />
          </Reveal>
        </div>
      </section>
    </>
  );
}
