# Tooth Care Dental Clinic — frontend

React + Vite single-page app for the demo dental clinic: the public patient website
(hero, treatments, clinic story, reviews, booking form) plus the staff console
(`/admin` — login, request inbox, filters, status transitions, staff notes).

It talks to the Express backend in `../../backend` using exactly its public contract:

| Method | Route | Used by |
|---|---|---|
| GET | `/api/clinic` | header, footer, booking aside |
| GET | `/api/services` | treatments grid/pages, booking form selects |
| POST | `/api/appointments` | booking form (with `X-Idempotency-Key` + honeypot `website`) |
| POST | `/api/admin/login` · `/logout` | staff sign-in (HttpOnly cookie) |
| GET | `/api/admin/me` | session guard for the console |
| GET | `/api/admin/appointments?page&limit&status&date&search` | inbox list + status counts |
| PATCH | `/api/admin/appointments/:id` | confirm / cancel / complete + staff notes |

## Run it

**One command for the whole stack** (MongoDB + seed + backend + this frontend):

```bash
node demo/dev.js          # from the project root
# stop everything:
node demo/stop.js         # or Ctrl+C in the dev.js terminal
```

See [demo/README.md](../README.md) for details. Manual alternative:

```bash
# 1. backend (needs MongoDB running locally)
cd backend
npm install
npm run seed     # creates admin + clinic profile + services
npm run dev      # http://localhost:5000

# 2. frontend (new terminal)
cd demo/frontend
npm install
npm run dev      # http://localhost:5173
```

The Vite dev server proxies `/api` and `/health` to `http://localhost:5000`
(configurable with `VITE_BACKEND_URL`), so cookies work and there is no CORS setup
in development. Copy `.env.example` to `.env` only if you want to change targets.

## Design notes

- **Palette**: bright mint → aqua gradients with coral, butter and violet accents on a warm paper background — deliberately far from a grey card grid.
- **Type**: Sora (display) + Manrope (body), loaded from Google Fonts with system fallbacks.
- **Motion**: scroll-reveal (IntersectionObserver, disabled under `prefers-reduced-motion`), floating hero chips, marquee strip, hover lifts, animated accordion/drawer — all CSS-driven, no animation library.
- **Layout**: asymmetric hero, bento treatment grid, alternating treatment rows, dark gradient booking band, sticky booking aside — sections vary instead of repeating boxes.

## Photos & artwork

`public/images/clinic-01.jpg` and `clinic-02.jpg` are **real photos of the clinic**, taken
from the Google-hosted images the clinic itself embeds on its site (the same photos shown
on its Google Maps listing). They feed the “Inside the clinic” gallery on Home and About
(`src/components/Gallery.jsx`, data in `src/data/content.js`). Two further Maps photos
exist but are access-restricted (HTTP 403) and could not be downloaded.

All other illustrations/icons are original inline SVGs in `src/components/Icon.jsx`.
To add more photos, drop files into `public/images/` and add entries to `GALLERY`.

## Verify

```bash
npm run build   # production bundle in dist/
npm run dev     # then open http://localhost:5173
```
