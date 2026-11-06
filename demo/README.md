# Demo — one command to run it all

```bash
node demo/dev.js
```

That single command starts, in order:

1. **MongoDB** — the in-memory database in [devdb](devdb/README.md) on `127.0.0.1:27017`
   (skipped automatically if you already run your own MongoDB there)
2. **Seed** — admin user + clinic profile + 8 services (idempotent, safe to re-run)
3. **Backend API** — Express on <http://localhost:5000>
4. **Frontend** — Vite on <http://localhost:5173> (proxies `/api` to the backend)

It installs missing dependencies on first run, waits for each service to be
reachable before starting the next, and prints:

| | |
|---|---|
| Website | <http://localhost:5173> |
| Staff console | <http://localhost:5173>/admin |
| Staff login | `admin@demodentalcare.com` / `ChangeMe123!` (the `ADMIN_*` values in `backend/.env` — the banner always prints the real ones) |

> The seeded admin comes from `backend/.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)
> unless overridden — the in-memory database is wiped whenever it stops, so just
> re-run the command (it re-seeds automatically).

## Stopping

- Press **Ctrl+C** in the terminal running `dev.js`, or
- from any other terminal:

```bash
node demo/stop.js
```

`stop.js` kills exactly the processes `dev.js` recorded (in
`demo/.demo-servers.json`) and confirms ports 27017 / 5000 / 5173 are free. It
never touches processes it didn't start.

## Notes

- `dev.js` forces `PORT=5000` for the backend because some shells export
  `PORT=0`, which would otherwise shadow `backend/.env` and pick a random port.
- Real photos of the clinic live in `frontend/public/images/` and are served
  statically — no hotlinking.
