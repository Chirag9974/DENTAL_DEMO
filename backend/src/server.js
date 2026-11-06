import http from 'node:http';
import { buildApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

const app = buildApp();
let server = null;

async function start() {
  await connectDb();
  logger.info('[db] connected');

  server = http.createServer(app);
  // Bound slow clients (slowloris) and stuck requests. Keep-alive is shorter
  // than headersTimeout, as Node recommends.
  server.requestTimeout = 30000;
  server.headersTimeout = 15000;
  server.keepAliveTimeout = 5000;

  server.listen(config.port, () => {
    logger.info(`[server] listening on :${config.port} (${config.env})`);
  });
}

async function shutdown(signal, code = 0) {
  logger.info(`[server] ${signal} received — shutting down gracefully`);
  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    await disconnectDb();
  } catch (err) {
    logger.error('[server] shutdown error', { error: err.message });
  } finally {
    process.exit(code);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (err) => logger.error('[server] unhandledRejection', { error: String(err) }));
process.on('uncaughtException', (err) => {
  logger.error('[server] uncaughtException', { error: err.message });
  shutdown('uncaughtException', 1);
});

start().catch((err) => {
  logger.error('[server] failed to start', { error: err.message });
  process.exit(1);
});
