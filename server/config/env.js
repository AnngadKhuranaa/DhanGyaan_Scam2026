import dotenv from 'dotenv';

dotenv.config();

const REQUIRED = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

/**
 * Validate environment variables once at startup and return a frozen config.
 * Fails fast with a readable message instead of crashing later with
 * "secretOrPrivateKey must have a value" in the middle of a request.
 */
export function loadEnv(source = process.env) {
  const missing = REQUIRED.filter((key) => !source[key] || !String(source[key]).trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}.\n` +
        'Copy server/.env.example to server/.env and fill them in.'
    );
  }

  if (source.JWT_SECRET === source.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different values.');
  }

  const nodeEnv = source.NODE_ENV || 'development';

  return Object.freeze({
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isTest: nodeEnv === 'test',
    port: Number(source.PORT) || 5000,
    mongoUri: source.MONGO_URI,
    jwtSecret: source.JWT_SECRET,
    jwtRefreshSecret: source.JWT_REFRESH_SECRET,
    accessTokenTtl: source.ACCESS_TOKEN_TTL || '15m',
    refreshTokenTtlDays: Number(source.REFRESH_TOKEN_TTL_DAYS) || 7,
    // Comma-separated whitelist, e.g. "http://localhost:5173,https://dhangyaan.vercel.app"
    clientUrls: (source.CLIENT_URL || 'http://localhost:5173')
      .split(',')
      .map((url) => url.trim().replace(/\/$/, ''))
      .filter(Boolean),
    startingBalance: Number(source.STARTING_BALANCE) || 1_000_000,
    newsApiKey: source.NEWS_API_KEY || '',
    geminiApiKey: source.GEMINI_API_KEY || '',
    geminiModel: source.GEMINI_MODEL || 'gemini-2.5-flash',
    openaiApiKey: source.OPENAI_API_KEY || '',
    openaiModel: source.OPENAI_MODEL || 'gpt-4o-mini',
    demoUsername: source.DEMO_USERNAME || 'demo',
  });
}

let cached;

/** Lazily-validated singleton used by the rest of the app. */
export function env() {
  if (!cached) cached = loadEnv();
  return cached;
}

/** Test hook: re-read process.env on the next env() call. */
export function resetEnvCache() {
  cached = undefined;
}
