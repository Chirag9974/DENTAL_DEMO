import { useSyncExternalStore } from 'react';
import { MOTION_EVENT } from '../lib/motion';

function subscribe(onChange) {
  window.addEventListener(MOTION_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(MOTION_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getSnapshot() {
  const attr = document.documentElement.getAttribute('data-motion');
  return attr === 'calm' ? 'calm' : 'full';
}

/** Reads the live motion mode ('full' | 'calm') applied to <html>. */
export function useMotionMode() {
  return useSyncExternalStore(subscribe, getSnapshot, () => 'full');
}
