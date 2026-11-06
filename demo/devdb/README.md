# devdb (local helper, not part of the app)

A throwaway **in-memory MongoDB** on `127.0.0.1:27017` so the demo backend can run
on a machine without a system MongoDB install (Windows/macOS/Linux; the binary is
downloaded on first run).

```bash
cd demo/devdb
npm install
npm start        # leave running; Ctrl+C stops and wipes the data

# then, in another terminal:
cd backend && npm run seed && npm run dev
```

Stop it and the data is gone — re-run `npm run seed`. To use a real MongoDB instead,
skip this folder entirely and point `MONGO_URI` at your own instance.
