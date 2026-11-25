import NodeCache from 'node-cache';

// useClones:false -> return the same object (callers must not mutate cached values).
const store = new NodeCache({ stdTTL: 60, checkperiod: 120, useClones: false });
const inFlight = new Map();

/**
 * Return a cached value or compute it once. Concurrent callers asking for the
 * same key share one in-flight promise, so a burst of 20 requests for AAPL
 * makes one upstream call instead of 20 (this is how we stay under Yahoo's
 * rate limits). Failures are not cached.
 */
export async function cached(key, ttlSeconds, compute) {
  const hit = store.get(key);
  if (hit !== undefined) return hit;

  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    try {
      const value = await compute();
      store.set(key, value, ttlSeconds);
      return value;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

export function setCached(key, value, ttlSeconds) {
  store.set(key, value, ttlSeconds);
}

export function clearCache() {
  store.flushAll();
  inFlight.clear();
}
