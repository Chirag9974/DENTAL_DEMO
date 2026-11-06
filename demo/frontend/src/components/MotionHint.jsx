import { useEffect, useState } from 'react';
import { savedMode, setMotionMode } from '../lib/motion';
import { useMotionMode } from '../hooks/useMotion';

const HINT_KEY = 'tc-motion-hint';

function hintSeen() {
  try {
    return window.localStorage.getItem(HINT_KEY) !== null;
  } catch {
    return false;
  }
}

function markHintSeen() {
  try {
    window.localStorage.setItem(HINT_KEY, 'seen');
  } catch {
    /* storage disabled — the hint just reappears next visit */
  }
}

/**
 * Calm mode is auto-selected from the OS setting, which is easy to forget
 * (Windows: Settings → Accessibility → Visual effects → Animation effects).
 * Offer a one-tap way out the first time, then stay quiet.
 */
export function MotionHint() {
  const mode = useMotionMode();
  const [hidden, setHidden] = useState(() => hintSeen() || savedMode() !== null);
  const visible = !hidden && mode === 'calm';

  useEffect(() => {
    if (visible) markHintSeen();
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="motion-hint" role="status">
      <span className="motion-hint__dot" aria-hidden="true" />
      <span className="motion-hint__text">Motion is reduced by your system setting.</span>
      <button
        type="button"
        className="motion-hint__cta"
        onClick={() => {
          setMotionMode('full');
          setHidden(true);
        }}
      >
        Turn it on
      </button>
      <button
        type="button"
        className="motion-hint__close"
        aria-label="Dismiss"
        onClick={() => setHidden(true)}
      >
        ×
      </button>
    </div>
  );
}
