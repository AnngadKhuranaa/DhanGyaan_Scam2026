import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import { registerUser, resetState, startTestServer, stopTestServer } from './helpers/setup.js';

let app;
let fake;

beforeAll(async () => {
  ({ app, fake } = await startTestServer());
});
afterAll(stopTestServer);
beforeEach(() => resetState(fake));

const trade = (auth, body) => request(app).post('/api/trades').set(auth).send(body);
const portfolio = async (auth) => (await request(app).get('/api/portfolio').set(auth)).body.data;
const clearCache = async () => (await import('../utils/cache.js')).clearCache();

describe('buy / sell rules', () => {
  test('requires authentication', async () => {
    const res = await request(app).post('/api/trades').send({ symbol: 'TCS.NS', side: 'BUY', quantity: 1 });
    expect(res.status).toBe(401);
  });

  test('buy executes at the server price and ignores a client-sent price', async () => {
    const { auth } = await registerUser(app);
    const res = await trade(auth, { symbol: 'tcs.ns', side: 'buy', quantity: 10, price: 0.01 });

    expect(res.status).toBe(201);
    expect(res.body.data.trade).toMatchObject({ symbol: 'TCS.NS', side: 'BUY', quantity: 10, price: 100, amountInr: 1000, balanceAfter: 999_000 });
    const p = await portfolio(auth);
    expect(p.cash).toBe(999_000);
    expect(p.holdings[0]).toMatchObject({ symbol: 'TCS.NS', quantity: 10, avgCostInr: 100 });
  });

  test.each([
    [0, 'zero'],
    [-5, 'negative'],
    [2.5, 'fractional'],
    ['10abc', 'non-numeric'],
  ])('rejects quantity %p (%s)', async (quantity) => {
    const { auth } = await registerUser(app);
    const res = await trade(auth, { symbol: 'TCS.NS', side: 'BUY', quantity });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/whole number/);
  });

  test('rejects an unknown symbol with 404 and changes nothing', async () => {
    const { auth } = await registerUser(app);
    const res = await trade(auth, { symbol: 'NOPE123', side: 'BUY', quantity: 1 });
    expect(res.status).toBe(404);
    expect((await portfolio(auth)).cash).toBe(1_000_000);
  });

  test('insufficient funds is a 400 and leaves balance, holdings and history untouched', async () => {
    const { auth } = await registerUser(app);
    const res = await trade(auth, { symbol: 'INFY.NS', side: 'BUY', quantity: 1000 }); // ₹15,00,000 > ₹10,00,000
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Insufficient funds/);

    const p = await portfolio(auth);
    expect(p.cash).toBe(1_000_000);
    expect(p.holdings).toHaveLength(0);
    const history = await request(app).get('/api/trades').set(auth);
    expect(history.body.data.total).toBe(0);
  });

  test('cannot sell more than held, or a stock never bought', async () => {
    const { auth } = await registerUser(app);
    await trade(auth, { symbol: 'TCS.NS', side: 'BUY', quantity: 5 });

    const oversell = await trade(auth, { symbol: 'TCS.NS', side: 'SELL', quantity: 6 });
    expect(oversell.status).toBe(400);
    expect(oversell.body.message).toMatch(/hold 5 shares/);

    const never = await trade(auth, { symbol: 'INFY.NS', side: 'SELL', quantity: 1 });
    expect(never.status).toBe(400);
    expect((await portfolio(auth)).holdings[0].quantity).toBe(5);
  });

  test('selling the whole position removes the holding', async () => {
    const { auth } = await registerUser(app);
    await trade(auth, { symbol: 'TCS.NS', side: 'BUY', quantity: 3 });
    await trade(auth, { symbol: 'TCS.NS', side: 'SELL', quantity: 3 });
    const p = await portfolio(auth);
    expect(p.holdings).toHaveLength(0);
    expect(p.cash).toBe(1_000_000);
  });

  test('a US stock settles in INR at the live FX rate', async () => {
    const { auth } = await registerUser(app);
    const res = await trade(auth, { symbol: 'AAPL', side: 'BUY', quantity: 2 }); // 2 x $200 x ₹80
    expect(res.status).toBe(201);
    expect(res.body.data.trade).toMatchObject({ currency: 'USD', price: 200, fxRate: 80, amountInr: 32_000 });
    expect((await portfolio(auth)).cash).toBe(968_000);
  });

  test('one user cannot see or touch another user’s portfolio', async () => {
    const alice = await registerUser(app);
    const bob = await registerUser(app);
    await trade(alice.auth, { symbol: 'TCS.NS', side: 'BUY', quantity: 7, userId: bob.user.id }); // userId in body is ignored
    expect((await portfolio(alice.auth)).holdings[0].quantity).toBe(7);
    expect((await portfolio(bob.auth)).holdings).toHaveLength(0);
  });
});

describe('consistency under concurrency', () => {
  test('parallel buys can never overspend: exactly the affordable number succeed', async () => {
    const { auth } = await registerUser(app);
    // Each order costs ₹3,00,000 (200 x ₹1,500). ₹10,00,000 affords exactly 3 of 6.
    const results = await Promise.all(
      Array.from({ length: 6 }, () => trade(auth, { symbol: 'INFY.NS', side: 'BUY', quantity: 200 }))
    );
    const ok = results.filter((r) => r.status === 201);
    const rejected = results.filter((r) => r.status === 400);
    expect(ok).toHaveLength(3);
    expect(rejected).toHaveLength(3);

    const p = await portfolio(auth);
    expect(p.cash).toBe(100_000);
    expect(p.holdings[0].quantity).toBe(600);
    const history = await request(app).get('/api/trades').set(auth);
    expect(history.body.data.total).toBe(3); // ledger matches holdings exactly
  });

  test('parallel sells can never sell the same shares twice', async () => {
    const { auth } = await registerUser(app);
    await trade(auth, { symbol: 'TCS.NS', side: 'BUY', quantity: 10 });
    const results = await Promise.all(Array.from({ length: 5 }, () => trade(auth, { symbol: 'TCS.NS', side: 'SELL', quantity: 4 })));
    expect(results.filter((r) => r.status === 201)).toHaveLength(2); // 4 + 4 = 8 <= 10, a third would need 12
    const p = await portfolio(auth);
    expect(p.holdings[0].quantity).toBe(2);
    expect(p.cash).toBe(1_000_000 - 1000 + 800);
  });

  test('a failure mid-transaction rolls back every write', async () => {
    const { auth, user } = await registerUser(app);
    // Force the Trade insert (the last write in the transaction) to fail.
    const Trade = mongoose.model('Trade');
    const spy = jest.spyOn(Trade, 'create').mockRejectedValueOnce(new Error('disk full'));

    const res = await trade(auth, { symbol: 'TCS.NS', side: 'BUY', quantity: 10 });
    spy.mockRestore();

    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error'); // no internals leaked
    const freshUser = await mongoose.model('User').findById(user.id).lean();
    expect(freshUser.balance).toBe(1_000_000); // cash debit was rolled back
    expect((await portfolio(auth)).holdings).toHaveLength(0); // holding was rolled back
  });
});

describe('P&L calculation', () => {
  test('weighted average cost, realised and unrealised P&L, and the totals identity', async () => {
    const { auth } = await registerUser(app);

    await trade(auth, { symbol: 'TCS.NS', side: 'BUY', quantity: 10 }); // 10 @ 100
    fake.setPrice('TCS.NS', 130);
    await clearCache();
    await trade(auth, { symbol: 'TCS.NS', side: 'BUY', quantity: 10 }); // 10 @ 130 -> avg 115

    let p = await portfolio(auth);
    expect(p.holdings[0].avgCostInr).toBe(115);

    await trade(auth, { symbol: 'TCS.NS', side: 'SELL', quantity: 5 }); // realised (130-115)*5 = 75
    fake.setPrice('TCS.NS', 120);
    await clearCache();

    p = await portfolio(auth);
    const h = p.holdings[0];
    expect(h.quantity).toBe(15);
    expect(h.avgCostInr).toBe(115); // selling doesn't change the average
    expect(p.realizedPnL).toBe(75);
    expect(h.unrealizedPnL).toBe(75); // (120-115)*15
    expect(p.unrealizedPnL).toBe(75);
    expect(p.totalPnL).toBe(150);
    // cash = 1,000,000 - 1,000 - 1,300 + 650 = 998,350; holdings = 15 * 120 = 1,800
    expect(p.cash).toBe(998_350);
    expect(p.totalValue).toBe(1_000_150);
    // Identity: everything gained shows up in totalValue vs the starting balance.
    expect(p.totalValue - p.startingBalance).toBeCloseTo(p.totalPnL, 6);
    expect(p.totalReturnPercent).toBe(0.02);

    const sells = await request(app).get('/api/trades').query({ side: 'SELL' }).set(auth);
    expect(sells.body.data.items[0].realizedPnL).toBe(75);
  });

  test('if prices are unavailable, holdings are valued at cost and flagged stale (not invented)', async () => {
    const { auth } = await registerUser(app);
    await trade(auth, { symbol: 'TCS.NS', side: 'BUY', quantity: 10 });
    await clearCache();
    fake.setFailing(true);
    const p = await portfolio(auth);
    expect(p.pricesStale).toBe(true);
    expect(p.holdings[0]).toMatchObject({ priceStale: true, marketValueInr: 1000, unrealizedPnL: 0 });
  });

  test('trade history supports pagination and filters', async () => {
    const { auth } = await registerUser(app);
    for (let i = 0; i < 3; i += 1) await trade(auth, { symbol: 'TCS.NS', side: 'BUY', quantity: 1 });
    await trade(auth, { symbol: 'INFY.NS', side: 'BUY', quantity: 1 });
    await trade(auth, { symbol: 'TCS.NS', side: 'SELL', quantity: 1 });

    const page1 = await request(app).get('/api/trades').query({ limit: 2, page: 1 }).set(auth);
    expect(page1.body.data).toMatchObject({ total: 5, totalPages: 3, page: 1 });
    expect(page1.body.data.items).toHaveLength(2);
    expect(page1.body.data.items[0].side).toBe('SELL'); // newest first

    const tcsBuys = await request(app).get('/api/trades').query({ symbol: 'tcs.ns', side: 'buy' }).set(auth);
    expect(tcsBuys.body.data.total).toBe(3);
  });
});
