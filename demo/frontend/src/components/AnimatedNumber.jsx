import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

/**
 * A stat card whose number counts up smoothly when scrolled into view.
 * (Renamed from StatCount: some privacy/ad-block extensions block script URLs
 * containing "stat"/"count", which broke the module graph → white screen.)
 */
export function AnimatedNumber({ value, label, suffix = '', countTo, decimals = 0 }) {
  const [ref, shown] = useAnimatedNumber(countTo ?? Number(value), { decimals });
  const display = decimals ? shown.toFixed(decimals) : shown;

  return (
    <div className="stat" ref={ref}>
      <b className="stat__num" aria-label={`${value}${suffix}`}>
        <span aria-hidden="true">{display}</span>
        {suffix ? <small> {suffix}</small> : ''}
      </b>
      <span>{label}</span>
    </div>
  );
}
