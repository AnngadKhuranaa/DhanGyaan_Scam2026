import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { createApp } from './app.js';
import logger from './utils/logger.js';

async function start() {
  let config;
  try {
    config = env();
  } catch (error) {
    // Fail fast with a readable message instead of a stack trace.
    console.error(`\n[config] ${error.message}\n`);
    process.exit(1);
  }

  try {
    await connectDB(config.mongoUri);
  } catch (error) {
    logger.error(`Could not connect to MongoDB: ${error.message}`);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`DhanGyaan API listening on http://localhost:${config.port} (${config.nodeEnv})`);
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start();
