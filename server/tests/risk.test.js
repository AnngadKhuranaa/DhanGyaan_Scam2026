import request from 'supertest';
import { registerUser, resetState, startTestServer, stopTestServer } from './helpers/setup.js';
import { createNormal, createRng, runSimulation } from '../services/risk.service.js';
import { mean, percentile, stdDev } from '../utils/stats.js';

describe('Monte Carlo engine (pure)', () => {
  const base = { amount: 100_000, dailyMean: 0.0003, dailyStd: 0.015, horizonDays: 252, paths: 4000, seed: 7 };

  test('is reproducible from its seed', () => {
    expect(runSimulation(base)).toEqual(runSimulation(base));
    expect(runSimulation({ ...base, seed: 8 }).outcomes.median).not.toBe(runSimulation(base).outcomes.median);
  });

  test('the normal generator has mean ~0 and stdev ~1', () => {
    const z = createNormal(createRng(1));
    const xs = Array.from({ length: 50_000 }, z);
    expect(mean(xs)).toBeCloseTo(0, 1);
    expect(stdDev(xs)).toBeCloseTo(1, 1);
  });

  test('output has the documented shape and ordered percentiles', () => {
    const r = runSimulation(base);
    const o = r.outcomes;
    expect(o.min).toBeLessThanOrEqual(o.worst);
    expect(o.worst).toBeLessThan(o.p25);
    expect(o.p25).toBeLessThan(o.median);
    expect(o.median).toBeLessThan(o.p75);
    expect(o.p75).toBeLessThan(o.best);
    expect(o.best).toBeLessThanOrEqual(o.max);
    expect(r.probabilityOfLoss).toBeGreaterThanOrEqual(0);
    expect(r.probabilityOfLoss).toBeLessThanOrEqual(100);
    expect(r.var95).toBeCloseTo(base.amount - o.worst, 1);
    expect(r.cvar95).toBeGreaterThanOrEqual(r.var95); // average tail loss >= the 5% cut-off loss
    expect(r.fan[0]).toMatchObject({ day: 0, p5: base.amount, p50: base.amount, p95: base.amount });
    expect(r.fan.at(-1).day).toBe(252);
    expect(r.fan.length).toBeLessThanOrEqual(62);
    expect(r.samplePaths.values[0]).toHaveLength(r.samplePaths.days.length);
  });

  test('matches closed-form GBM: median = A*e^(mT) and P(loss) = Phi(-m*sqrt(T)/s)', () => {
    const r = runSimulation({ ...base, paths: 10_000 });
    const T = base.horizonDays;
    const expectedMedian = base.amount * Math.exp(base.dailyMean * T);
    expect(Math.abs(r.outcomes.median / expectedMedian - 1)).toBeLessThan(0.02);

    // Phi via the error function approximation (Abramowitz-Stegun 7.1.26).
    const erf = (x) => {
      const t = 1 / (1 + 0.3275911 * Math.abs(x));
      const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
      return x >= 0 ? y : -y;
    };
    const phi = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
    const expectedLoss = phi((-base.dailyMean * Math.sqrt(T)) / base.dailyStd) * 100;
    expect(Math.abs(r.probabilityOfLoss - expectedLoss)).toBeLessThan(2); // within 2 percentage points
  });

  test('zero volatility is deterministic growth with no risk', () => {
    const r = runSimulation({ ...base, dailyStd: 0, paths: 100 });
    expect(r.outcomes.worst).toBeCloseTo(r.outcomes.best, 6);
    expect(r.probabilityOfLoss).toBe(0);
    expect(r.var95).toBe(0);
  });

  test('percentile interpolates linearly', () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentile([0, 10], 25)).toBe(2.5);
  });
});

describe('POST /api/risk/simulate', () => {
  let app;
  let fake;
  beforeAll(async () => {
    ({ app, fake } = await startTestServer());
  });
  afterAll(stopTestServer);
  beforeEach(() => resetState(fake));

  test('calibrates on (fake) history and returns the full result shape', async () => {
    const { auth } = await registerUser(app);
    const res = await request(app)
      .post('/api/risk/simulate')
      .set(auth)
      .send({ symbol: 'TCS.NS', amount: 50_000, horizonDays: 63, paths: 500, seed: 123 });

    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d).toMatchObject({ symbol: 'TCS.NS', currency: 'INR', inputs: { amount: 50_000, horizonDays: 63, paths: 500, lookback: '2y', seed: 123 } });
    expect(d.calibration.observations).toBe(299);
    expect(d.calibration.annualizedVolatilityPercent).toBeGreaterThan(0);
    expect(Object.keys(d.outcomes)).toEqual(expect.arrayContaining(['best', 'median', 'worst', 'mean']));
    expect(['Low', 'Medium', 'High']).toContain(d.riskLevel);
    expect(d.assumptions.length).toBeGreaterThan(0);

    const again = await request(app).post('/api/risk/simulate').set(auth).send({ symbol: 'TCS.NS', amount: 50_000, horizonDays: 63, paths: 500, seed: 123 });
    expect(again.body.data.outcomes).toEqual(d.outcomes);
  });

  test('validates inputs', async () => {
    const { auth } = await registerUser(app);
    const res = await request(app).post('/api/risk/simulate').set(auth).send({ symbol: 'TCS.NS', amount: 10, horizonDays: 5000, paths: 1 });
    expect(res.status).toBe(400);
    expect(res.body.data.errors.map((e) => e.field)).toEqual(expect.arrayContaining(['amount', 'horizonDays', 'paths']));
  });

  test('unknown symbol is a 404; provider outage is a 503 (no invented history)', async () => {
    const { auth } = await registerUser(app);
    expect((await request(app).post('/api/risk/simulate').set(auth).send({ symbol: 'NOPE', amount: 5000 })).status).toBe(404);
    fake.setFailing(true);
    expect((await request(app).post('/api/risk/simulate').set(auth).send({ symbol: 'TCS.NS', amount: 5000 })).status).toBe(503);
  });
});
