import { Link, useSearchParams } from 'react-router-dom';
import { Reveal } from '../components/Reveal';
import { Icon, Blob } from '../components/Icon';
import { useClinic } from '../context/ClinicContext';
import { formatPrice } from '../lib/format';
import { TREATMENT_ICONS, MAPS_URL } from '../data/content';

const EXPECT = [
  { icon: 'note', label: 'Consultation & digital scan' },
  { icon: 'shield', label: 'Written plan with timelines' },
  { icon: 'calendar', label: 'Scheduled reviews until done' },
];

export default function Treatments() {
  const { services, status, error, reload } = useClinic();
  const [params] = useSearchParams();
  const highlight = params.get('highlight') || '';

  return (
    <>
      <header className="pagehead">
        <Blob className="pagehead__blob" tone="violet" />
        <div className="shell pagehead__inner">
          <Reveal>
            <span className="eyebrow">Treatments</span>
            <h1 style={{ marginTop: 16 }}>
              Every treatment, <span className="gradient-text">up front.</span>
            </h1>
            <p className="lede">
              Durations and “from” prices come straight from the clinic’s system — exact quotes are given after a look in the
              chair, never before.
            </p>
          </Reveal>
          <Reveal delay={0.12} className="pagehead__aside">
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ marginBottom: 10 }}>What every visit includes</h3>
              <ul className="ticks ticks--tight">
                {EXPECT.map((e) => (
                  <li key={e.label}>
                    <span className="tick">
                      <Icon name="check" size={13} />
                    </span>
                    {e.label}
                  </li>
                ))}
              </ul>
              <Link to="/book" className="btn btn-brand btn-block" style={{ marginTop: 16 }}>
                Request a slot <span className="arr">→</span>
              </Link>
            </div>
          </Reveal>
        </div>
      </header>

      <section className="section section--tight">
        <div className="shell">
          {status === 'loading' && (
            <div className="treatment-list">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 230, borderRadius: 26, marginBottom: 26 }} />
              ))}
            </div>
          )}

          {status === 'error' && (
            <div className="alert alert-error">
              <Icon name="close" size={20} />
              <span>
                <b>Could not load treatments.</b> {error?.message}{' '}
                <button type="button" className="linkish" onClick={reload}>
                  Retry
                </button>
              </span>
            </div>
          )}

          {status === 'ready' && (
            <div className="treatment-list">
              {services.map((s, i) => {
                const IconName = TREATMENT_ICONS[s.slug] || 'tooth';
                const flip = i % 2 === 1;
                return (
                  <Reveal key={s.slug}>
                    <article id={s.slug} className={`treatment ${flip ? 'treatment--flip' : ''} ${highlight === s.slug ? 'treatment--flash' : ''}`}>
                      <div className={`treatment__visual treatment__visual--${i % 4}`}>
                        <span className="treatment__icon">
                          <Icon name={IconName} size={64} />
                        </span>
                        <div className="treatment__facts">
                          <span>
                            <Icon name="clock" size={15} /> {s.durationMinutes} min
                          </span>
                          {s.priceFrom > 0 && <span>from {formatPrice(s.priceFrom)}</span>}
                        </div>
                      </div>

                      <div className="treatment__body">
                        <span className="treatment__index">{String(i + 1).padStart(2, '0')}</span>
                        <h2>{s.title}</h2>
                        <p className="lede">{s.description}</p>
                        <div className="treatment__actions">
                          <Link to={`/book?service=${encodeURIComponent(s.title)}`} className="btn btn-brand">
                            Book this treatment <span className="arr">→</span>
                          </Link>
                          <a className="chip" href={MAPS_URL} target="_blank" rel="noreferrer">
                            <Icon name="pin" size={15} /> See on Maps
                          </a>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          )}

          <div className="treatments-cta">
            <h3>Not sure what you need?</h3>
            <p className="lede">Describe the problem in a request — the clinic will tell you which treatment fits, and what it costs.</p>
            <Link to="/book" className="btn btn-warm btn-lg">
              Ask the clinic <span className="arr">→</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
