import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/** Connect to MongoDB. Paper trading uses transactions, so this must be a replica set (Atlas is). */
export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  logger.info(`MongoDB connected (${mongoose.connection.host}/${mongoose.connection.name})`);

  // Reconcile indexes with the current schemas. Mongoose never changes an existing
  // index on its own, so e.g. the old non-sparse unique `phone` index would keep
  // blocking users who don't give a phone number.
  const dropped = await mongoose.syncIndexes();
  const changed = Object.entries(dropped).filter(([, names]) => names?.length);
  if (changed.length) logger.info(`Synced indexes, dropped stale: ${JSON.stringify(Object.fromEntries(changed))}`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
