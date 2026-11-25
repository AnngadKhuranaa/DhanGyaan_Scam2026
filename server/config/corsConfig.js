/**
 * Only origins listed in CLIENT_URL may call the API from a browser.
 * `credentials: true` is needed so the httpOnly refresh-token cookie is sent.
 */
export function buildCorsOptions(allowedOrigins) {
  return {
    origin(origin, callback) {
      // Non-browser clients (curl, health checks, server-to-server) send no Origin.
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}
