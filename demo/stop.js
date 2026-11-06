#!/usr/bin/env node
/**
 * Stops everything `demo/dev.js` started:
 *
 *     node demo/stop.js
 *
 * Kills the recorded process trees (db, api, web) from demo/.demo-servers.json
 * and reports which demo ports are still occupied afterwards. It never kills
 * processes it did not start.
 */
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PID_FILE = path.join(ROOT, '.demo-servers.json');
const PORTS = [
  { port: 27017, name: 'MongoDB' },
  { port: 5000, name: 'Backend API' },
  { port: 5173, name: 'Frontend' },
];

function isListening(port) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host: '127.0.0.1' });
    sock.once('connect', () => {
      sock.destroy();
      resolve(true);
    });
    sock.once('error', () => resolve(false));
  });
}

function killPid(pid) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const p = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      p.on('exit', () => resolve());
    } else {
      try {
        process.kill(-pid, 'SIGTERM');
      } catch {
        try {
          process.kill(pid, 'SIGTERM');
        } catch {
          /* already gone */
        }
      }
      // escalate if still alive shortly after
      setTimeout(() => {
        try {
          process.kill(-pid, 'SIGKILL');
        } catch {
          /* gone */
        }
        resolve();
      }, 1500);
    }
  });
}

async function main() {
  let stopped = 0;

  if (fs.existsSync(PID_FILE)) {
    const { procs } = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
    for (const { name, pid } of procs) {
      process.stdout.write(`stopping ${name} (pid ${pid})… `);
      await killPid(pid);
      console.log('done');
      stopped += 1;
    }
    fs.unlinkSync(PID_FILE);
  } else {
    console.log('no demo/.demo-servers.json found — nothing started by demo/dev.js is tracked');
  }

  // small grace period, then confirm the demo ports are actually free
  await new Promise((r) => setTimeout(r, 1200));
  const busy = [];
  for (const p of PORTS) {
    if (await isListening(p.port)) busy.push(p);
  }

  if (busy.length) {
    console.log('\nStill listening (not started by demo/dev.js, so left alone):');
    for (const p of busy) console.log(`  • ${p.name} — 127.0.0.1:${p.port}`);
    if (process.platform === 'win32') {
      const r = spawnSync('cmd.exe', ['/c', 'netstat -ano | findstr LISTENING | findstr :' + busy.map((b) => b.port).join(' :')], { encoding: 'utf8' });
      if (r.stdout.trim()) console.log(`\n${r.stdout.trim()}`);
    }
    process.exitCode = 0; // not a failure — those aren't ours
  } else {
    console.log(
      stopped
        ? '\n✓ Demo stack fully stopped — ports 27017, 5000 and 5173 are free.'
        : '\n✓ Nothing of ours was running; demo ports are free.'
    );
  }
}

main().catch((err) => {
  console.error(`stop.js failed: ${err.message}`);
  process.exit(1);
});
