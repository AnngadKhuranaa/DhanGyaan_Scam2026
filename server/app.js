import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { env } from './config/env.js';
import { buildCorsOptions } from './config/corsConfig.js';
import { apiLimiter } from './middleware/rateLimit.middleware.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { httpLogStream } from './utils/logger.js';
import { sendSuccess } from './utils/http.js';
import apiRoutes from './routes/index.js';

/**
 * Build the Express app without starting a server, so tests can import it.
 * Middleware order matters and is deliberate:
 * security headers -> CORS -> body parsing -> sanitising -> logging -> rate limit -> routes -> 404 -> errors
 */
export function createApp() {
  const config = env();
  const app = express();

  // Render/Railway/Vercel sit behind a proxy: needed for correct client IPs in rate limiting.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(cors(buildCorsOptions(config.clientUrls)));
  app.use(express.json({ limit: '20kb' }));
  app.use(cookieParser());
  // Strips keys starting with "$" or containing "." (blocks {"$ne": null} login injection).
  app.use(mongoSanitize());
  if (!config.isTest) {
    app.use(morgan(config.isProduction ? 'combined' : 'dev', { stream: httpLogStream }));
  }

  app.get('/api/health', (req, res) => {
    const dbUp = mongoose.connection.readyState === 1;
    res.status(dbUp ? 200 : 503).json({
      success: dbUp,
      data: { status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'connected' : 'disconnected', uptime: process.uptime() },
      message: dbUp ? 'OK' : 'Database not connected',
    });
  });

  app.use('/api', apiLimiter, apiRoutes);
  app.get('/', (req, res) => sendSuccess(res, { name: 'DhanGyaan API', docs: '/api/health' }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
