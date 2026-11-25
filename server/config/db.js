import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/** Connect to MongoDB. Paper trading uses transactions, so this must be a replica set (Atlas is). */
export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  logger.info(`MongoDB connected (${mongoose.connection.host}/${mongoose.connection.name})`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
