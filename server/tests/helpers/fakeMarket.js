/**
 * Deterministic stand-in for the yahoo-finance2 client (same method names and
 * response shapes we use: quote, chart, search). Prices can be changed by tests.
 */
const DEFAULT_PRICES = {
  'TCS.NS': { price: 100, currency: 'INR', name: 'Tata Consultancy Services Limited' },
  'INFY.NS': { price: 1500, currency: 'INR', name: 'Infosys Limited' },
  AAPL: { price: 200, currency: 'USD', name: 'Apple Inc.' },
  'USDINR=X': { price: 80, currency: 'INR', name: 'USD/INR' },
};

/** A gently trending, slightly noisy but fully deterministic price series. */
export function syntheticCloses(n = 300, start = 100, dailyDrift = 0.0005, wobble = 0.01) {
  const closes = [];
  let p = start;
  for (let i = 0; i < n; i += 1) {
    p *= Math.exp(dailyDrift + wobble * Math.sin(i * 1.7) * Math.cos(i * 0.37));
    closes.push(p);
  }
  return closes;
}

export function createFakeMarket() {
  let prices = structuredClone(DEFAULT_PRICES);
  let failing = false;
  const calls = { quote: 0, chart: 0 };

  const toYahooQuote = (symbol) => {
    const p = prices[symbol];
    if (!p) return undefined;
    return {
      symbol,
      shortName: p.name,
      longName: p.name,
      regularMarketPrice: p.price,
      regularMarketChange: 1,
      regularMarketChangePercent: 1,
      regularMarketPreviousClose: p.price - 1,
      regularMarketVolume: 1_000_000,
      currency: p.currency,
      fullExchangeName: symbol.endsWith('.NS') ? 'NSE' : 'NasdaqGS',
      marketState: 'REGULAR',
      regularMarketTime: new Date(),
    };
  };

  return {
    calls,
    setPrice(symbol, price) {
      prices[symbol] = { ...(prices[symbol] || { currency: 'INR', name: symbol }), price };
    },
    setFailing(value) {
      failing = value;
    },
    reset() {
      prices = structuredClone(DEFAULT_PRICES);
      failing = false;
      calls.quote = 0;
      calls.chart = 0;
    },

    async quote(symbolOrList) {
      calls.quote += 1;
      if (failing) throw new Error('fetch failed: ECONNRESET');
      if (Array.isArray(symbolOrList)) return symbolOrList.map(toYahooQuote).filter(Boolean);
      return toYahooQuote(symbolOrList);
    },

    async chart(symbol) {
      calls.chart += 1;
      if (failing) throw new Error('fetch failed: ECONNRESET');
      if (!prices[symbol]) throw new Error('No data found, symbol may be delisted');
      const closes = syntheticCloses(300, prices[symbol].price / 1.15);
      const now = Date.now();
      return {
        quotes: closes.map((close, i) => ({
          date: new Date(now - (closes.length - i) * 86_400_000),
          open: close,
          high: close * 1.01,
          low: close * 0.99,
          close,
          volume: 1000,
        })),
      };
    },

    async search(q) {
      return {
        quotes: Object.entries(prices)
          .filter(([s, p]) => s.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase()))
          .map(([symbol, p]) => ({ symbol, longname: p.name, quoteType: 'EQUITY', exchange: symbol.endsWith('.NS') ? 'NSI' : 'NMS', exchDisp: 'X' })),
      };
    },
  };
}
