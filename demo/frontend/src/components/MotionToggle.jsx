import { setMotionMode } from '../lib/motion';
import { useMotionMode } from '../hooks/useMotion';

/**
 * Explicit motion control. The site follows the OS `prefers-reduced-motion`
 * setting on a first visit; this lets anyone override it per device without
 * hunting through system settings.
 */
export function MotionToggle() {
  const mode = useMotionMode();
  const calm = mode === 'calm';

  return (
    <span className="motion-toggle">
      <span className="motion-toggle__label" aria-hidden="true">
        Motion
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={!calm}
        aria-label={`Animations ${calm ? 'off' : 'on'} — switch to ${calm ? 'full' : 'calm'} motion`}
        className={`motion-toggle__switch ${calm ? '' : 'is-on'}`}
        onClick={() => setMotionMode(calm ? 'full' : 'calm')}
      >
        <span className="motion-toggle__track" aria-hidden="true">
          <span className="motion-toggle__dot" />
        </span>
        <span className="motion-toggle__text">{calm ? 'Calm' : 'Full'}</span>
      </button>
    </span>
  );
}
