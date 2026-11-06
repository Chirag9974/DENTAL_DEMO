import { Link } from 'react-router-dom';
import { Icon, HeroArt } from '../components/Icon';

export default function NotFound() {
  return (
    <section className="notfound">
      <div className="shell notfound__inner">
        <HeroArt className="notfound__art" />
        <div>
          <span className="eyebrow warm">404</span>
          <h1 style={{ marginTop: 16 }}>This page took a sick day.</h1>
          <p className="lede">The link you followed doesn’t exist — but the clinic does.</p>
          <div className="hero__ctas" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-brand">
              Back home <span className="arr">→</span>
            </Link>
            <Link to="/book" className="btn btn-ghost">
              <Icon name="calendar" size={18} /> Book a visit
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
