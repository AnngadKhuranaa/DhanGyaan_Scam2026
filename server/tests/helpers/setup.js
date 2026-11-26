/**
 * Shared test harness:
 * - a real in-memory MongoDB *replica set* (so trade transactions really run)
 * - a fake Yahoo client so no test touches the network
 * - helpers to register a user and get an auth header
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { createFakeMarket } from './fakeMarket.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.MONGO_URI = 'mongodb://placeholder'; // replaced once the replica set starts
process.env.STARTING_BALANCE = '1000000';
process.env.NEWS_API_KEY = '';
process.env.GEMINI_API_KEY = '';
process.env.OPENAI_API_KEY = '';

let replSet;

export async function startTestServer() {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  process.env.MONGO_URI = replSet.getUri('dhangyaan-test');
  await mongoose.connect(process.env.MONGO_URI);

  const { createApp } = await import('../../app.js');
  const market = await import('../../services/marketData.service.js');
  const fake = createFakeMarket();
  market.setMarketClient(fake);

  // Make sure unique indexes exist before tests that rely on them run.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  return { app: createApp(), fake };
}

export async function stopTestServer() {
  await mongoose.disconnect();
  await replSet?.stop();
}

/** Wipe all collections and caches between tests. */
export async function resetState(fake) {
  const { clearCache } = await import('../../utils/cache.js');
  clearCache();
  fake?.reset();
  await Promise.all(Object.values(mongoose.connection.collections).map((c) => c.deleteMany({})));
}

let counter = 0;
/** Register a fresh user and return { agent, auth, user, accessToken }. */
export async function registerUser(app, overrides = {}) {
  counter += 1;
  const body = {
    username: `user_${counter}`,
    email: `user${counter}@example.com`,
    password: 'secret123',
    ...overrides,
  };
  const agent = request.agent(app); // keeps the refresh cookie
  const res = await agent.post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  const { accessToken, user } = res.body.data;
  return { agent, user, accessToken, auth: { Authorization: `Bearer ${accessToken}` }, password: body.password };
}
