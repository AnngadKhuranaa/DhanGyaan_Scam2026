import NodeCache from 'node-cache';

// Default TTL: 5 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const getCache = (key) => cache.get(key);

export const setCache = (key, value, ttl) => {
  if (ttl !== undefined) return cache.set(key, value, ttl);
  return cache.set(key, value);
};

export const delCache = (key) => cache.del(key);

export const flushCache = () => cache.flushAll();
