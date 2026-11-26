import request from 'supertest';
import { registerUser, resetState, startTestServer, stopTestServer } from './helpers/setup.js';
import { aggregate, scoreText } from '../services/sentimentScorer.js';
import { WEIGHTS, computeConfidence } from '../services/insights.service.js';
import { companyQuery, setNewsClientFactory } from '../services/sentiment.service.js';
import { setAiOverride } from '../services/ai.service.js';
import { resetEnvCache } from '../config/env.js';
import { syntheticCloses } from './helpers/fakeMarket.js';

describe('sentiment scorer', () => {
  test('is deterministic and uses whole words only', () => {
    const t = 'Infosys beats estimates as shares surge';
    expect(scoreText(t)).toEqual(scoreText(t));
    expect(scoreText(t).label).toBe('positive');
    // The old substring scorer counted "up" inside "update" / "support".
    expect(scoreText('Company to update investors; support levels hold').matched).toEqual([]);
  });

  test('handles negation and reports matched words', () => {
    const r = scoreText('TCS fails to beat estimates');
    expect(r.label).toBe('negative');
    expect(r.matched).toEqual(['not beat (-2)']);
  });

  test('aggregate averages headline scores and counts labels', () => {
    const items = [scoreText('shares surge'), scoreText('shares plunge'), scoreText('company holds meeting')];
    const a = aggregate(items);
    expect(a.counts).toEqual({ positive: 1, neutral: 1, negative: 1 });
    expect(a.score).toBeCloseTo((items[0].score + items[1].score + items[2].score) / 3, 3);
  });

  test('company names are cleaned for the news query', () => {
    expect(companyQuery('Reliance Industries Limited', 'RELIANCE.NS')).toBe('Reliance Industries');
    expect(companyQuery('', 'TCS.NS')).toBe('TCS');
  });
});

describe('confidence score formula', () => {
  const uptrend = syntheticCloses(260, 100, 0.002, 0.005); // steady rise, low noise
  const downtrend = syntheticCloses(260, 100, -0.002, 0.005);
  const realSentiment = { score: 0.5, demo: false, headlines: [{}, {}] };

  test('weights sum to 1 and components are 0-100', () => {
    expect(Object.values(WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    const r = computeConfidence({ closes: uptrend, sentiment: realSentiment });
    for (const c of r.components) {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(100);
    }
  });

  test('score equals the weighted sum of its components', () => {
    const r = computeConfidence({ closes: uptrend, sentiment: realSentiment });
    const manual = r.components.reduce((s, c) => s + c.weight * c.score, 0);
    expect(r.score).toBeCloseTo(manual, 0);
    expect(r.components.find((c) => c.key === 'sentiment').score).toBe(75); // 50 + 50 * 0.5
  });

  test('an uptrend scores higher than a downtrend', () => {
    const up = computeConfidence({ closes: uptrend, sentiment: null });
    const down = computeConfidence({ closes: downtrend, sentiment: null });
    expect(up.score).toBeGreaterThan(down.score);
    expect(up.components.find((c) => c.key === 'trend').score).toBeGreaterThan(50);
    expect(down.components.find((c) => c.key === 'momentum').score).toBeLessThan(50);
  });

  test('demo sentiment is excluded and the other weights re-normalised', () => {
    const r = computeConfidence({ closes: uptrend, sentiment: { score: 1, demo: true, headlines: [{}] } });
    const s = r.components.find((c) => c.key === 'sentiment');
    expect(s.included).toBe(false);
    expect(s.contribution).toBe(0);
    const used = r.components.filter((c) => c.included);
    expect(used.reduce((sum, c) => sum + c.effectiveWeight, 0)).toBeCloseTo(1, 2);
  });
});

describe('insights + AI endpoints (external APIs mocked)', () => {
  let app;
  let fake;
  beforeAll(async () => {
    ({ app, fake } = await startTestServer());
  });
  afterAll(stopTestServer);
  beforeEach(async () => {
    await resetState(fake);
    process.env.NEWS_API_KEY = '';
    resetEnvCache();
    setAiOverride(null);
  });

  test('without a NewsAPI key, sentiment is labelled demo data', async () => {
    const { auth } = await registerUser(app);
    const res = await request(app).get('/api/insights/sentiment/TCS.NS').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ demo: true, demoReason: expect.stringMatching(/NEWS_API_KEY/) });
  });

  test('with a key, headlines are fetched once, scored, deduped and cached in MongoDB', async () => {
    process.env.NEWS_API_KEY = 'test-key';
    resetEnvCache();

    let calls = 0;
    setNewsClientFactory(() => ({
      v2: {
        everything: async (params) => {
          calls += 1;
          expect(params.q).toBe('"Tata Consultancy Services"');
          return {
            status: 'ok',
            articles: [
              { title: 'TCS shares surge on record profit', source: { name: 'Mint' }, url: 'https://x/1', publishedAt: new Date().toISOString() },
              { title: 'TCS shares surge on record profit', source: { name: 'Dup' }, url: 'https://x/2', publishedAt: new Date().toISOString() },
              { title: 'TCS faces probe over contract', source: { name: 'ET' }, url: 'https://x/3', publishedAt: new Date().toISOString() },
            ],
          };
        },
      },
    }));

    try {
      const { auth } = await registerUser(app);
      const first = await request(app).get('/api/insights/sentiment/TCS.NS').set(auth);
      const second = await request(app).get('/api/insights/sentiment/TCS.NS').set(auth);
      expect(first.status).toBe(200);
      expect(first.body.data).toMatchObject({ demo: false, cached: false, counts: { positive: 1, negative: 1, neutral: 0 } });
      expect(first.body.data.headlines).toHaveLength(2);
      expect(second.body.data.cached).toBe(true);
      expect(calls).toBe(1);
    } finally {
      process.env.NEWS_API_KEY = '';
      resetEnvCache();
    }
  });

  test('confidence endpoint returns the breakdown and flags demo sentiment', async () => {
    const { auth } = await registerUser(app);
    const res = await request(app).get('/api/insights/confidence/INFY.NS').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ symbol: 'INFY.NS', sentimentDemo: true, label: expect.any(String) });
    expect(res.body.data.components.map((c) => c.key)).toEqual(['trend', 'momentum', 'volatility', 'sentiment']);
  });

  test('AI chat sends real context (position + metrics) to the provider', async () => {
    const { auth } = await registerUser(app);
    await request(app).post('/api/trades').set(auth).send({ symbol: 'TCS.NS', side: 'BUY', quantity: 4 });

    let seen;
    setAiOverride(async ({ system, messages }) => {
      seen = { system, messages };
      return { text: 'Mocked answer', provider: 'mock', model: 'mock-1' };
    });

    const res = await request(app).post('/api/ai/chat').set(auth).send({ message: 'Is this risky?', symbol: 'TCS.NS' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ reply: 'Mocked answer', provider: 'mock', context: { symbol: 'TCS.NS', hasPosition: true } });
    expect(res.body.data.disclaimer).toMatch(/not financial advice/);
    const prompt = seen.messages.at(-1).content;
    expect(prompt).toMatch(/USER POSITION: 4 shares/);
    expect(prompt).toMatch(/Confidence score/);
    expect(seen.system).toMatch(/Never invent/);
  });

  test('without any AI key the reply is a labelled rule-based summary', async () => {
    const { auth } = await registerUser(app);
    const res = await request(app).post('/api/ai/chat').set(auth).send({ message: 'Explain', symbol: 'INFY.NS' });
    expect(res.status).toBe(200);
    expect(res.body.data.provider).toBe('rule-based');
    expect(res.body.data.reply).toMatch(/Confidence/);
  });
});
