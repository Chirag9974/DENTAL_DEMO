/**
 * Original SVG icon + illustration set. All artwork is drawn here so the site
 * ships with zero third-party image dependencies (swap in real photos any time
 * by dropping files into /public/images — see README).
 */

export function Icon({ name, size = 24, className = '', ...rest }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    className,
    ...rest,
  };

  switch (name) {
    case 'tooth':
      return (
        <svg {...common}>
          <path d="M12 4.6c-1.6-1.4-3.4-2-5-1.5C4.6 3.7 3.4 5.7 3.4 8.4c0 3.6 1.7 6 2.6 9 .6 2 1 4.1 2.2 4.1 1.3 0 1.5-2.3 1.9-4.4.3-1.7.9-2.7 1.9-2.7s1.6 1 1.9 2.7c.4 2.1.6 4.4 1.9 4.4 1.2 0 1.6-2.1 2.2-4.1.9-3 2.6-5.4 2.6-9 0-2.7-1.2-4.7-3.6-5.3-1.6-.5-3.4.1-5 1.5Z" />
        </svg>
      );
    case 'aligner':
      return (
        <svg {...common}>
          <path d="M4 8c0-2.2 3.6-4 8-4s8 1.8 8 4c0 3-1.5 4.6-2.4 7.4-.6 1.9-1 4.6-2.2 4.6-1.1 0-1.3-2.3-1.7-4.2-.3-1.6-1-2.6-1.7-2.6s-1.4 1-1.7 2.6c-.4 1.9-.6 4.2-1.7 4.2-1.2 0-1.6-2.7-2.2-4.6C5.5 12.6 4 11 4 8Z" />
          <path d="M7.5 9.2c2.7.9 6.3.9 9 0" opacity=".55" />
        </svg>
      );
    case 'braces':
      return (
        <svg {...common}>
          <path d="M4 8c0-2.2 3.6-4 8-4s8 1.8 8 4c0 3-1.5 4.6-2.4 7.4-.6 1.9-1 4.6-2.2 4.6-1.1 0-1.3-2.3-1.7-4.2-.3-1.6-1-2.6-1.7-2.6s-1.4 1-1.7 2.6c-.4 1.9-.6 4.2-1.7 4.2-1.2 0-1.6-2.7-2.2-4.6C5.5 12.6 4 11 4 8Z" />
          <path d="M5.2 9.5h13.6" />
          <rect x="7.4" y="7.7" width="2.6" height="2.6" rx=".7" />
          <rect x="14" y="7.7" width="2.6" height="2.6" rx=".7" />
        </svg>
      );
    case 'implant':
      return (
        <svg {...common}>
          <path d="M9 4.5c-.6-.8-1.5-1.3-2.5-1.1C5 3.7 4.3 5.2 4.5 7c.2 2 1.1 3.4 1.7 5.3" />
          <path d="M15 4.5c.6-.8 1.5-1.3 2.5-1.1 1.5.3 2.2 1.8 2 3.6-.2 2-1.1 3.4-1.7 5.3" />
          <path d="M12 6v6" />
          <path d="M9.6 13.4h4.8l-.6 3.4h-3.6l-.6-3.4Z" />
          <path d="M10.4 18h3.2M10.8 20.4h2.4" />
        </svg>
      );
    case 'rootcanal':
      return (
        <svg {...common}>
          <path d="M12 4.6c-1.6-1.4-3.4-2-5-1.5C4.6 3.7 3.4 5.7 3.4 8.4c0 3.6 1.7 6 2.6 9 .6 2 1 4.1 2.2 4.1 1.3 0 1.5-2.3 1.9-4.4.3-1.7.9-2.7 1.9-2.7s1.6 1 1.9 2.7c.4 2.1.6 4.4 1.9 4.4 1.2 0 1.6-2.1 2.2-4.1.9-3 2.6-5.4 2.6-9 0-2.7-1.2-4.7-3.6-5.3-1.6-.5-3.4.1-5 1.5Z" />
          <path d="M12 7.5v4M10.3 9.3 12 11.5l1.7-2.2" opacity=".7" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg {...common}>
          <path d="M12 3.5 13.8 9 19.5 10.8 13.8 12.6 12 18.2 10.2 12.6 4.5 10.8 10.2 9 12 3.5Z" />
          <path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" opacity=".6" />
        </svg>
      );
    case 'smile':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.3 13.6c1 1.7 2.3 2.5 3.7 2.5s2.7-.8 3.7-2.5" />
          <path d="M9 9.4h.01M15 9.4h.01" strokeWidth="2.4" />
        </svg>
      );
    case 'filling':
      return (
        <svg {...common}>
          <path d="M12 4.6c-1.6-1.4-3.4-2-5-1.5C4.6 3.7 3.4 5.7 3.4 8.4c0 3.6 1.7 6 2.6 9 .6 2 1 4.1 2.2 4.1 1.3 0 1.5-2.3 1.9-4.4.3-1.7.9-2.7 1.9-2.7s1.6 1 1.9 2.7c.4 2.1.6 4.4 1.9 4.4 1.2 0 1.6-2.1 2.2-4.1.9-3 2.6-5.4 2.6-9 0-2.7-1.2-4.7-3.6-5.3-1.6-.5-3.4.1-5 1.5Z" />
          <path d="M9.6 7.6 14.4 10" opacity=".7" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...common}>
          <path d="M6.2 3.8h3l1.4 3.6-1.8 1.4a12 12 0 0 0 5.4 5.4l1.4-1.8 3.6 1.4v3A2.4 2.4 0 0 1 16.6 19 13.6 13.6 0 0 1 4 6.4a2.4 2.4 0 0 1 2.2-2.6Z" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s6.5-6.1 6.5-11A6.5 6.5 0 0 0 5.5 10c0 4.9 6.5 11 6.5 11Z" />
          <circle cx="12" cy="10" r="2.4" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 1.8" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg {...common}>
          <path d="M20 11.7a8 8 0 0 1-11.9 7L4 20l1.4-3.9A8 8 0 1 1 20 11.7Z" />
          <path d="M9.2 9.1c.3-.6.6-.6.9-.6h.6c.2 0 .4 0 .6.5l.7 1.6c.1.3 0 .5-.1.7l-.4.5c-.1.2-.2.4 0 .7a7 7 0 0 0 3.1 2.7c.3.1.5.1.7-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.8c.3.1.4.3.4.5 0 .7-.5 1.6-1.5 1.8-1 .2-2.6.1-5.2-1.6a11 11 0 0 1-3.8-4.4c-.6-1.4-.4-2.6.2-3.3Z" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
          <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3.5 5 6v5.4c0 4.2 3 7.5 7 9.1 4-1.6 7-4.9 7-9.1V6l-7-2.5Z" />
          <path d="m9 12 2.2 2.2L15.5 10" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 3.6l2.5 5.1 5.6.8-4 4 1 5.6L12 16.4l-5.1 2.7 1-5.6-4-4 5.6-.8L12 3.6Z" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12.5 4.5 4.5L19 7" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8.5" r="3.8" />
          <path d="M4.8 20a7.6 7.6 0 0 1 14.4 0" />
        </svg>
      );
    case 'note':
      return (
        <svg {...common}>
          <path d="M6 3.5h9L19.5 8v12.5H6V3.5Z" />
          <path d="M14.5 3.7V8.3h4.8M9 12.5h6M9 16h4" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...common}>
          <path d="M14 7.5V5.2c0-1-.8-1.7-1.7-1.7H5.7C4.8 3.5 4 4.2 4 5.2v13.6c0 1 .8 1.7 1.7 1.7h6.6c1 0 1.7-.8 1.7-1.7v-2.3" />
          <path d="M9.5 12h11M17 8.5l3.5 3.5L17 15.5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
        </svg>
      );
  }
}

/** Big hero illustration: a radiant smile arc floating over a gradient blob. */
export function HeroArt({ className = '' }) {
  return (
    <svg viewBox="0 0 520 520" className={className} role="img" aria-label="Illustration of a confident smile">
      <defs>
        <linearGradient id="ha-blob" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00c9a7" />
          <stop offset="0.55" stopColor="#0bb6d8" />
          <stop offset="1" stopColor="#7c5cff" />
        </linearGradient>
        <linearGradient id="ha-tooth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e6fbff" />
        </linearGradient>
        <linearGradient id="ha-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc947" />
          <stop offset="1" stopColor="#ff6b5e" />
        </linearGradient>
      </defs>

      <path
        d="M266 44c92-8 176 44 202 128 27 87-14 176-84 231-66 52-160 67-236 28C76 391 24 306 44 220 65 130 158 53 266 44Z"
        fill="url(#ha-blob)"
        opacity="0.16"
      />
      <circle cx="262" cy="252" r="176" fill="none" stroke="url(#ha-ring)" strokeWidth="14" strokeDasharray="6 26" strokeLinecap="round" opacity="0.75" />
      <circle cx="262" cy="252" r="140" fill="#ffffff" opacity="0.65" />

      {/* tooth */}
      <g transform="translate(178 150)">
        <path
          d="M84 12c-15-13-33-19-49-14C6 3 -5 23-5 51c0 36 17 61 26 92 6 20 10 42 23 42 13 0 15-24 19-46 3-18 9-28 21-28s18 10 21 28c4 22 6 46 19 46 13 0 17-22 23-42 9-31 26-56 26-92 0-28-11-48-35-53-16-5-34 1-49 14Z"
          fill="url(#ha-tooth)"
          stroke="#0bb6d8"
          strokeWidth="5"
        />
        <path d="M28 52c25 10 87 10 112 0" fill="none" stroke="#00c9a7" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
        <circle cx="52" cy="84" r="7" fill="#0c1b2a" />
        <circle cx="110" cy="84" r="7" fill="#0c1b2a" />
        <path d="M58 106c9 12 37 12 46 0" fill="none" stroke="#ff6b5e" strokeWidth="6" strokeLinecap="round" />
      </g>

      {/* sparkle */}
      <path d="M410 128l9 25 25 9-25 9-9 25-9-25-25-9 25-9 9-25Z" fill="#ffc947" />
      <path d="M92 330l7 18 18 7-18 7-7 18-7-18-18-7 18-7 7-18Z" fill="#ff6b5e" />
      <circle cx="436" cy="366" r="12" fill="#7c5cff" opacity="0.8" />
      <circle cx="110" cy="120" r="9" fill="#00c9a7" />
    </svg>
  );
}

/** Soft portrait illustration for the doctor section. */
export function DoctorArt({ className = '' }) {
  return (
    <svg viewBox="0 0 420 480" className={className} role="img" aria-label="Illustration of a smiling dentist">
      <defs>
        <linearGradient id="da-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00c9a7" />
          <stop offset="1" stopColor="#3d8bff" />
        </linearGradient>
        <linearGradient id="da-coat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eaf6fb" />
        </linearGradient>
      </defs>
      <rect x="20" y="20" width="380" height="440" rx="48" fill="url(#da-bg)" opacity="0.16" />
      <circle cx="210" cy="205" r="150" fill="#fff" opacity="0.55" />
      {/* shoulders / coat */}
      <path d="M96 460c6-74 46-118 114-118s108 44 114 118H96Z" fill="url(#da-coat)" stroke="#0c1b2a" strokeOpacity="0.12" strokeWidth="3" />
      <path d="M186 344l24 34 24-34" fill="none" stroke="#0bb6d8" strokeWidth="6" strokeLinecap="round" />
      {/* head */}
      <path d="M210 122c38 0 66 28 66 68 0 44-30 76-66 76s-66-32-66-76c0-40 28-68 66-68Z" fill="#ffd9c2" />
      {/* hair */}
      <path d="M140 190c-4-52 26-88 70-88s74 32 70 84c-6-24-22-38-40-44-20-6-30-16-40-30-14 20-34 34-50 40-6 2-9 14-10 38Z" fill="#2b2118" />
      <path d="M282 196c8 6 12 20 10 40-6-14-12-22-20-26l10-14Z" fill="#2b2118" />
      {/* face */}
      <circle cx="184" cy="200" r="6" fill="#0c1b2a" />
      <circle cx="236" cy="200" r="6" fill="#0c1b2a" />
      <path d="M174 184c6-6 16-7 22-3M224 181c7-4 17-3 22 3" stroke="#2b2118" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M192 236c11 11 25 11 36 0" fill="none" stroke="#e2564b" strokeWidth="6" strokeLinecap="round" />
      {/* stethoscope */}
      <path d="M170 356c-4 34 10 56 40 56s44-22 40-56" fill="none" stroke="#0c1b2a" strokeWidth="7" strokeLinecap="round" opacity="0.75" />
      <circle cx="250" cy="416" r="14" fill="#0c1b2a" opacity="0.8" />
      <circle cx="250" cy="416" r="6" fill="#ffc947" />
      <path d="M330 74l7 19 19 7-19 7-7 19-7-19-19-7 19-7 7-19Z" fill="#ffc947" />
    </svg>
  );
}

/** Abstract decorative blobs used behind sections. */
export function Blob({ className = '', tone = 'mint' }) {
  const colors = {
    mint: ['#00c9a7', '#0bb6d8'],
    warm: ['#ff6b5e', '#ffc947'],
    violet: ['#7c5cff', '#0bb6d8'],
  };
  const [a, b] = colors[tone] || colors.mint;
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`blob-${tone}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <path
        d="M210 24c74-10 148 34 166 108 19 77-24 154-90 194-64 39-150 34-200-16C36 262 24 176 62 114 99 54 145 33 210 24Z"
        fill={`url(#blob-${tone})`}
      />
    </svg>
  );
}
