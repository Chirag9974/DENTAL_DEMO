#!/usr/bin/env node
/**
 * One command to run the whole demo stack:
 *
 *     node demo/dev.js
 *
 * It starts, in order:
 *   1. MongoDB        — demo/devdb in-memory mongod on 127.0.0.1:27017
 *                       (skipped automatically if something already listens there)
 *   2. Seed           — backend `src/seed.js` (idempotent: admin + clinic + services)
 *   3. Backend API    — Express on http://localhost:5000
 *   4. Frontend       — Vite dev server on http://localhost:5173 (proxies /api)
 *
 * Ctrl+C stops everything (children are tracked in demo/.demo-servers.json so
 * `node demo/stop.js` can also kill them from another terminal).
 */
import { spawn } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)); // demo/
const BACKEND = path.join(ROOT, '..', 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const DEVDB = path.join(ROOT, 'devdb');
const PID_FILE = path.join(ROOT, '.demo-servers.json');

const API_PORT = 5000;
const WEB_PORT = 5173;
const DB_PORT = 27017;

const children = []; // { name, child }
let shuttingDown = false;

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(name, color, line) {
  console.log(`${color}[${name}]${c.reset} ${c.dim}${line}${c.reset}`);
}

function pipeOutput(name, color, child) {
  const attach = (stream, isErr) => {
    readline.createInterface({ input: stream }).on('line', (line) => {
      if (!line.trim()) return;
      // keep noise down: skip chatty vite/HMR debug lines
      if (line.includes('[vite]') || line.includes('hmr update')) return;
      if (isErr) log(name, color, line);
      else log(name, color, line);
    });
  };
  if (child.stdout) attach(child.stdout, false);
  if (child.stderr) attach(child.stderr, true);
}

const LOOPBACKS = ['127.0.0.1', '::1']; // Vite binds `localhost`, which resolves to ::1 on this machine

function tryConnect(port, host) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host });
    sock.once('connect', () => {
      sock.destroy();
      resolve(true);
    });
    sock.once('error', () => {
      sock.destroy();
      resolve(false);
    });
  });
}

async function isAnyListening(port) {
  for (const host of LOOPBACKS) {
    if (await tryConnect(port, host)) return true;
  }
  return false;
}

async function waitForPort(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (await isAnyListening(port)) return;
    if (Date.now() > deadline) {
      throw new Error(`timed out waiting for localhost:${port} (checked 127.0.0.1 and ::1)`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
}

async function assertPortFree(port, label) {
  if (await isAnyListening(port)) {
    const hint =
      process.platform === 'win32'
        ? `  Find it with:  netstat -ano | findstr :${port}   then:  taskkill /PID <pid> /T /F`
        : `  Find it with:  lsof -nP -iTCP:${port} -sTCP:LISTEN`;
    throw new Error(
      `${label} is already in use on port ${port} (likely a server left over from another terminal).\n${hint}\n  Then run this command again.`
    );
  }
}

function start(name, color, args, cwd, env = {}) {
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  children.push({ name, child });
  pipeOutput(name, color, child);
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    if (code !== 0 && code !== null) {
      console.error(`${color}[${name}]${c.reset} exited with code ${code} — ${c.red}stopping stack${c.reset}`);
      shutdown(1);
    }
  });
  return child;
}

async function ensureDeps(dir, label) {
  if (fs.existsSync(path.join(dir, 'node_modules'))) return;
  log(label, c.yellow, 'dependencies missing — running npm install (first run only)…');
  await new Promise((resolve, reject) => {
    const p = spawn('npm', ['install', '--no-audit', '--no-fund'], {
      cwd: dir,
      shell: process.platform === 'win32', // npm.cmd on Windows
      stdio: 'inherit',
    });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`npm install failed in ${dir}`))));
  });
}

// The staff login the seed actually wrote (values live in backend/.env — never hardcoded here)
function readAdminCreds() {
  return new Promise((resolve) => {
    const src =
      "import('./src/config/env.js').then(m => console.log(JSON.stringify(m.config.adminSeed))).catch(() => {})";
    const p = spawn(process.execPath, ['-e', src], {
      cwd: BACKEND,
      env: { ...process.env, PORT: String(API_PORT) },
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.on('exit', () => {
      try {
        const parsed = JSON.parse(out.trim().split('\n').filter(Boolean).pop());
        resolve(parsed && parsed.email && parsed.password ? parsed : null);
      } catch {
        resolve(null);
      }
    });
  });
}

async function main() {
  console.log(`\n${c.bold}${c.green}▸ Tooth Care demo — starting full stack${c.reset}\n`);

  // install anything missing so the single command truly works cold
  await ensureDeps(BACKEND, 'backend');
  await ensureDeps(FRONTEND, 'frontend');
  await ensureDeps(DEVDB, 'devdb');

  // 1. MongoDB — reuse whatever is already on 27017, otherwise start in-memory mongod
  const dbAlreadyUp = await isAnyListening(DB_PORT);

  if (dbAlreadyUp) {
    log('db', c.green, `reusing MongoDB already listening on 127.0.0.1:${DB_PORT}`);
  } else {
    log('db', c.green, 'starting in-memory MongoDB (first run downloads the mongod binary)…');
    start('db', c.green, ['start-db.mjs'], DEVDB);
    await waitForPort(DB_PORT, 180000);
    log('db', c.green, `MongoDB ready on 127.0.0.1:${DB_PORT}`);
  }

  // 2. Seed (idempotent). PORT=5000 is forced because some shells export PORT=0
  //    which would otherwise shadow backend/.env and pick a random port.
  log('seed', c.cyan, 'seeding admin + clinic profile + services…');
  await new Promise((resolve, reject) => {
    const seed = spawn(process.execPath, ['src/seed.js'], {
      cwd: BACKEND,
      env: { ...process.env, PORT: String(API_PORT) },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    pipeOutput('seed', c.cyan, seed);
    seed.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`seed exited with code ${code}`))
    );
  });

  // 3. Backend API (plain node — `--watch` on Windows fires spurious restarts that
  //    reset in-flight requests; restart via Ctrl+C + re-run after editing backend code)
  await assertPortFree(API_PORT, 'backend API');
  start('api', c.cyan, ['src/server.js'], BACKEND, { PORT: String(API_PORT) });
  await waitForPort(API_PORT, 60000);

  // 4. Frontend (vite via its local bin, avoids npm wrapper processes)
  await assertPortFree(WEB_PORT, 'frontend (Vite)');
  start('web', c.yellow, ['node_modules/vite/bin/vite.js'], FRONTEND, {
    VITE_BACKEND_URL: `http://localhost:${API_PORT}`,
  });
  await waitForPort(WEB_PORT, 60000);

  // record pids so demo/stop.js can kill the trees from anywhere
  fs.writeFileSync(
    PID_FILE,
    JSON.stringify({ startedAt: new Date().toISOString(), procs: children.map(({ name, child }) => ({ name, pid: child.pid })) }, null, 2)
  );

  const adminCreds = await readAdminCreds();

  console.log(`
${c.bold}${c.green}✓ Everything is up${c.reset}
  ${c.bold}Website${c.reset}        http://localhost:${WEB_PORT}
  ${c.bold}Staff console${c.reset}   http://localhost:${WEB_PORT}/admin
  ${c.bold}API${c.reset}            http://localhost:${API_PORT}  (proxied as /api on the web port)
  ${c.bold}MongoDB${c.reset}        127.0.0.1:${DB_PORT} (${dbAlreadyUp ? 'yours' : 'in-memory, wiped on stop'})

  ${c.bold}Staff login${c.reset}     ${adminCreds ? `${adminCreds.email} / ${adminCreds.password}` : 'ADMIN_EMAIL / ADMIN_PASSWORD (see backend/.env)'}
  ${c.dim}(kept in sync with backend/.env — every start re-seeds this admin)${c.reset}

  Press ${c.bold}Ctrl+C${c.reset} to stop everything, or run ${c.bold}node demo/stop.js${c.reset} from another terminal.
`);
}

function killTree(pid) {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } else {
    try {
      process.kill(-pid, 'SIGTERM'); // process group
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        /* already gone */
      }
    }
  }
}

async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n${c.bold}Stopping the demo stack…${c.reset}`);
  for (const { name, child } of children) {
    if (child.exitCode === null && !child.killed) {
      log(name, c.red, 'stopping…');
      killTree(child.pid);
    }
  }
  try {
    fs.unlinkSync(PID_FILE);
  } catch {
    /* fine */
  }
  setTimeout(() => process.exit(exitCode), 800);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

main().catch((err) => {
  console.error(`\n${c.red}Failed to start: ${err.message}${c.reset}`);
  shutdown(1);
});
