import { useEffect, useRef, useState } from 'react';
import { currentMode } from '../lib/motion';

/**
 * Animates a number from 0 to `target` when the element becomes visible.
 * Eases out with rAF, shows the final value instantly in calm motion mode,
 * and re-runs if the target changes.
 *
 * (File/hook renamed from useCountUp: some privacy/ad-block extensions block
 * any script URL containing "count"/"stat" — which white-screened the app.)
 */
export function useAnimatedNumber(target, { duration = 1400, decimals = 0 } = {}) {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || target === undefined || target === null || Number.isNaN(Number(target))) {
      setValue(Number(target) || 0);
      return undefined;
    }

    if (currentMode() === 'calm') {
      setValue(Number(target));
      return undefined;
    }

    let raf = 0;
    let start = null;
    const from = 0;
    const to = Number(target);

    const tick = (now) => {
      if (start === null) start = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const next = from + (to - from) * eased;
      setValue(decimals ? Number(next.toFixed(decimals)) : Math.round(next));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            raf = requestAnimationFrame(tick);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, duration, decimals]);

  return [ref, value];
}
