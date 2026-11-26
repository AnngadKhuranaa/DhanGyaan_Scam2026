import request from 'supertest';
import { resetState, startTestServer, stopTestServer } from './helpers/setup.js';

let app;
let fake;

beforeAll(async () => {
  ({ app, fake } = await startTestServer());
});
afterAll(stopTestServer);
beforeEach(() => resetState(fake));

describe('market data (Yahoo mocked)', () => {
  test('quote is normalised and the symbol upper-cased', async () => {
    const res = await request(app).get('/api/market/quote/tcs.ns');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ symbol: 'TCS.NS', price: 100, currency: 'INR', market: 'IN' });
  });

  test('unknown symbol -> 404, malformed symbol -> 400, provider outage -> 503', async () => {
    expect((await request(app).get('/api/market/quote/NOPE')).status).toBe(404);
    expect((await request(app).get('/api/market/quote/AA;PL')).status).toBe(400);
    fake.setFailing(true);
    const down = await request(app).get('/api/market/quote/TCS.NS');
    expect(down.status).toBe(503);
    expect(down.body.message).toMatch(/unavailable/);
  });

  test('concurrent requests for the same quote make ONE upstream call (cache de-duplication)', async () => {
    await Promise.all(Array.from({ length: 10 }, () => request(app).get('/api/market/quote/INFY.NS')));
    expect(fake.calls.quote).toBe(1);
  });

  test('history returns ordered candles and validates range', async () => {
    const res = await request(app).get('/api/market/history/TCS.NS').query({ range: '1y' });
    expect(res.status).toBe(200);
    const { candles } = res.body.data;
    expect(candles.length).toBeGreaterThan(200);
    expect(new Date(candles[0].date) < new Date(candles.at(-1).date)).toBe(true);
    expect((await request(app).get('/api/market/history/TCS.NS').query({ range: '10y' })).status).toBe(400);
  });

  test('search can be restricted to NSE or US listings', async () => {
    const india = await request(app).get('/api/market/search').query({ q: 'i', market: 'IN' });
    const us = await request(app).get('/api/market/search').query({ q: 'apple', market: 'US' });
    expect(india.body.data.every((r) => r.symbol.endsWith('.NS'))).toBe(true);
    expect(us.body.data.map((r) => r.symbol)).toEqual(['AAPL']);
  });
});
