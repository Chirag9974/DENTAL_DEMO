import { useCallback, useEffect, useRef, useState } from 'react';
import { Reveal } from './Reveal';
import { Icon } from './Icon';
import { GALLERY, MAPS_URL } from '../data/content';

/**
 * "Inside the clinic" photo band built from the clinic's real Google-hosted
 * photos. Tiles zoom subtly on hover; clicking opens a keyboard-accessible
 * lightbox (Esc / arrow keys / scrim click) with a smooth scale-fade.
 */
export default function Gallery() {
  const [active, setActive] = useState(null); // index of the enlarged photo
  const closeRef = useRef(null);

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir) => setActive((i) => (i === null ? i : (i + dir + GALLERY.length) % GALLERY.length)),
    []
  );

  useEffect(() => {
    if (active === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [active, close, step]);

  return (
    <section className="section gallery" aria-label="Photos of the clinic">
      <div className="shell">
        <div className="section-head">
          <Reveal>
            <span className="eyebrow">Inside the clinic</span>
            <h2 style={{ marginTop: 14 }}>
              The room you’ll <span className="gradient-text">actually</span> walk into.
            </h2>
            <p className="lede">
              Real photos from the clinic’s Google listing — no stock imagery. Tap any photo to see it full size.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <a className="chip chip--mint" href={MAPS_URL} target="_blank" rel="noreferrer">
              <Icon name="pin" size={15} /> See all photos on Google Maps
            </a>
          </Reveal>
        </div>

        <div className={`gallery__grid gallery__grid--${GALLERY.length}`}>
          {GALLERY.map((photo, i) => (
            <Reveal key={photo.src} delay={i * 0.12}>
              <button
                type="button"
                className={`gallery__tile gallery__tile--${photo.ratio}`}
                onClick={() => setActive(i)}
                aria-label={`Open photo: ${photo.alt}`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  width={i === 0 ? 1172 : 712}
                  height={i === 0 ? 661 : 950}
                />
                <span className="gallery__caption">
                  <b>{photo.caption}</b>
                  <small>{photo.note}</small>
                </span>
                <span className="gallery__zoom" aria-hidden="true">
                  <Icon name="search" size={17} />
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {active !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Clinic photo viewer">
          <button type="button" className="lightbox__scrim" aria-label="Close photo" onClick={close} />
          <figure className="lightbox__stage">
            <img src={GALLERY[active].src} alt={GALLERY[active].alt} />
            <figcaption>
              {GALLERY[active].caption} · <small>{GALLERY[active].note}</small>
            </figcaption>
            {GALLERY.length > 1 && (
              <>
                <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => step(-1)} aria-label="Previous photo">
                  ←
                </button>
                <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => step(1)} aria-label="Next photo">
                  →
                </button>
              </>
            )}
            <button type="button" ref={closeRef} className="lightbox__close" onClick={close} aria-label="Close">
              <Icon name="close" size={20} />
            </button>
            <span className="lightbox__count">
              {active + 1} / {GALLERY.length}
            </span>
          </figure>
        </div>
      )}
    </section>
  );
}
