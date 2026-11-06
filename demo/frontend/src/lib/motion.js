/**
 * Motion preference.
 *
 * Motion is a first-class setting, not something the OS flag can erase:
 *   full — the site's full editorial motion (reveals, bobbing, marquee, counters)
 *   calm — no continuous/sweeping motion; fades, eases and hover feedback stay
 *
 * Resolution order: explicit choice (localStorage) → OS `prefers-reduced-motion`
 * → full. The same resolution runs in an inline script in index.html before
 * first paint, so there is never a flash of the wrong mode.
 */
const STORAGE_KEY = 'tc-motion';
const QUERY = '(prefers-reduced-motion: reduce)';
const EVENT = 'tc:motion';

export const MOTION_EVENT = EVENT;

export function systemPrefersCalm() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

/** The saved choice, or null when the visitor never picked one. */
export function savedMode() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'full' || value === 'calm' ? value : null;
  } catch {
    return null;
  }
}

export function resolveMode() {
  return savedMode() || (systemPrefersCalm() ? 'calm' : 'full');
}

/** What the document is actually rendering right now. */
export function currentMode() {
  const attr = document.documentElement.getAttribute('data-motion');
  if (attr === 'full' || attr === 'calm') return attr;
  return resolveMode();
}

/** Applies a mode without remembering it (used for the live OS preference). */
export function applyMode(mode) {
  const next = mode === 'calm' ? 'calm' : 'full';
  document.documentElement.setAttribute('data-motion', next);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { mode: next } }));
}

/** Applies a mode and remembers it as this visitor's explicit choice. */
export function setMotionMode(mode) {
  const next = mode === 'calm' ? 'calm' : 'full';
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private mode / storage disabled — the attribute still applies */
  }
  applyMode(next);
}

/**
 * Follow the OS setting live — but only for visitors who never picked a mode,
 * and never persist it: a system change is not an explicit choice.
 */
export function watchSystemPreference() {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia(QUERY);
  const onChange = () => {
    if (!savedMode()) applyMode(systemPrefersCalm() ? 'calm' : 'full');
  };
  mq.addEventListener?.('change', onChange);
  return () => mq.removeEventListener?.('change', onChange);
}
