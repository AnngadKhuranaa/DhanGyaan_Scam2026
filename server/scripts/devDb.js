/**
 * Local development database: a single-node MongoDB replica set (transactions
 * need a replica set) with data persisted to server/.mongo-data.
 *
 *   npm run dev:db   ->  then set MONGO_URI=mongodb://127.0.0.1:27017/dhangyaan?replicaSet=rs0
 *
 * Not needed if you use MongoDB Atlas (already a replica set).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(here, '..', '.mongo-data');
const port = Number(process.env.DEV_DB_PORT) || 27017;
fs.mkdirSync(dbPath, { recursive: true });

const replSet = await MongoMemoryReplSet.create({
  replSet: { name: 'rs0', count: 1, storageEngine: 'wiredTiger' },
  instanceOpts: [{ port, dbPath }],
});

console.log(`\nDev MongoDB running (data in ${dbPath})`);
console.log(`MONGO_URI=mongodb://127.0.0.1:${port}/dhangyaan?replicaSet=rs0\n`);
console.log('Press Ctrl+C to stop.');

const stop = async () => {
  await replSet.stop({ doCleanup: false });
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
