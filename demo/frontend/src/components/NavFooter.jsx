import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import { MotionToggle } from './MotionToggle';
import { useClinic } from '../context/ClinicContext';
import { SECOND_PHONE } from '../data/content';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/treatments', label: 'Treatments' },
  { to: '/about', label: 'The clinic' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { clinic } = useClinic();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    return () => document.body.classList.remove('nav-open');
  }, [open]);

  const phone = clinic?.phone || '';
  const tel = phone.replace(/[^\d+]/g, '');

  return (
    <header className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
      <div className="shell nav__inner">
        <Link to="/" className="brand" aria-label="Tooth Care Dental Clinic — home">
          <span className="brand__mark">
            <Icon name="tooth" size={22} />
          </span>
          <span className="brand__text">
            Tooth&nbsp;Care
            <small>Dental Clinic · Jaipur</small>
          </span>
        </Link>

        <nav className={`nav__links ${open ? 'is-open' : ''}`} aria-label="Primary">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}>
              {l.label}
            </NavLink>
          ))}
          {tel && (
            <a className="nav__link nav__link--phone" href={`tel:${tel}`}>
              <Icon name="phone" size={16} /> {phone}
            </a>
          )}
          <Link to="/book" className="btn btn-brand btn-sm nav__cta-mob">
            Book now <span className="arr">→</span>
          </Link>
        </nav>

        <div className="nav__actions">
          <Link to="/book" className="btn btn-brand btn-sm nav__cta">
            Book now <span className="arr">→</span>
          </Link>
          <button
            type="button"
            className={`nav__burger ${open ? 'is-open' : ''}`}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>
      <div className="nav__sheet" hidden={!open}>
        <div className="shell">Everything on this site is one tap away — treatments, timings and same-day requests.</div>
      </div>
    </header>
  );
}

export function Footer() {
  const { clinic } = useClinic();
  const tel = (clinic?.phone || '').replace(/[^\d+]/g, '');

  return (
    <footer className="footer">
      <div className="shell footer__grid">
        <div className="footer__brand">
          <div className="brand brand--light">
            <span className="brand__mark">
              <Icon name="tooth" size={22} />
            </span>
            <span className="brand__text">
              Tooth&nbsp;Care
              <small>Dental Clinic · Jaipur</small>
            </span>
          </div>
          <p>
            {clinic?.tagline ||
              'Gentle, modern dentistry — Invisalign, braces, implants and painless root canals in Jaipur.'}
          </p>
          <div className="footer__socials">
            <a className="chip" href="https://www.instagram.com/toothcaredentalclinicjaipur/" target="_blank" rel="noreferrer">
              Instagram
            </a>
            <a className="chip" href={clinic?.mapUrl || 'https://maps.app.goo.gl/sToTpFbKWAs2JEod6'} target="_blank" rel="noreferrer">
              Directions
            </a>
          </div>
        </div>

        <div>
          <h4>Visit</h4>
          <p className="footer__line">
            <Icon name="pin" size={17} />
            <span>{clinic?.address || 'S-70, Sindhi Colony, Jawahar Nagar, Jaipur, Rajasthan 302004'}</span>
          </p>
          {tel && (
            <p className="footer__line">
              <Icon name="phone" size={17} />
              <span>
                <a href={`tel:${tel}`}>{clinic.phone}</a>
                {SECOND_PHONE && (
                  <>
                    {' · '}
                    <a href={`tel:${SECOND_PHONE.replace(/[^\d+]/g, '')}`}>{SECOND_PHONE}</a>
                  </>
                )}
              </span>
            </p>
          )}
          {clinic?.email && (
            <p className="footer__line">
              <Icon name="note" size={17} />
              <a href={`mailto:${clinic.email}`}>{clinic.email}</a>
            </p>
          )}
          {clinic?.whatsappUrl && (
            <p className="footer__line">
              <Icon name="whatsapp" size={17} />
              <a href={clinic.whatsappUrl} target="_blank" rel="noreferrer">
                Chat on WhatsApp
              </a>
            </p>
          )}
        </div>

        <div>
          <h4>Hours</h4>
          <p className="footer__line">
            <Icon name="clock" size={17} />
            <span>{clinic?.hours || 'Mon–Sat · 10:00–20:00 · Sun 10:00–14:00'}</span>
          </p>
          <h4 style={{ marginTop: 18 }}>Explore</h4>
          <ul className="footer__links">
            <li>
              <Link to="/treatments">Treatments</Link>
            </li>
            <li>
              <Link to="/about">The clinic</Link>
            </li>
            <li>
              <Link to="/book">Book an appointment</Link>
            </li>
            <li>
              <Link to="/admin">Staff login</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="shell footer__bottom">
        <span>© {new Date().getFullYear()} Tooth Care Dental Clinic · Jaipur</span>
        <span className="footer__bottom-note">Requests are confirmed by the clinic — nothing is auto-booked.</span>
        <MotionToggle />
      </div>
    </footer>
  );
}
