/**
 * Starts an ephemeral mongod bound to 127.0.0.1:27017 (the backend's default
 * MONGO_URI) and keeps it alive until Ctrl+C. Downloads the mongod binary on
 * first run. Data is in-memory — re-run `npm run seed` in backend/ after a restart.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create({
  instance: { ip: '127.0.0.1', port: 27017 },
});

console.log(`[devdb] mongod ready at ${mongod.getUri()}dental_demo`);

async function stop() {
  await mongod.stop();
  process.exit(0);
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

setInterval(() => {}, 1 << 30); // keep the process alive
