import YahooFinance from 'yahoo-finance2';
import ApiError from '../utils/ApiError.js';
import { cached } from '../utils/cache.js';
import logger from '../utils/logger.js';

/**
 * The single source of market data for the whole app (quotes, history,
 * search, FX, movers, indices). Everything goes through yahoo-finance2 and the
 * shared cache. There is deliberately NO random/mock fallback: if Yahoo is
 * down we return 503 and the UI shows an error with a retry button.
 */

let client = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/** Test hook: swap the Yahoo client for a fake so tests never hit the network. */
export function setMarketClient(fake) {
  client = fake;
}

const TTL = {
  quote: 30, // seconds; "live" enough for paper trading without hammering Yahoo
  history: 30 * 60,
  search: 10 * 60,
  fx: 5 * 60,
};

const SYMBOL_PATTERN = /^[A-Z0-9^][A-Z0-9.^=&-]{0,19}$/;

export const MARKETS = {
  IN: {
    label: 'NSE',
    currency: 'INR',
    universe: [
      'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'HINDUNILVR.NS',
      'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS', 'LT.NS', 'AXISBANK.NS',
      'BAJFINANCE.NS', 'MARUTI.NS', 'ASIANPAINT.NS', 'SUNPHARMA.NS', 'TITAN.NS', 'WIPRO.NS',
      'NTPC.NS', 'ULTRACEMCO.NS',
    ],
    indices: [
      { symbol: '^NSEI', name: 'NIFTY 50' },
      { symbol: '^NSEBANK', name: 'NIFTY BANK' },
      { symbol: '^BSESN', name: 'SENSEX' },
    ],
  },
  US: {
    label: 'US',
    currency: 'USD',
    universe: [
      'AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AVGO', 'JPM', 'V',
      'NFLX', 'AMD', 'INTC', 'WMT', 'DIS', 'KO', 'PEP', 'ORCL', 'CRM', 'BA',
    ],
    indices: [
      { symbol: '^GSPC', name: 'S&P 500' },
      { symbol: '^IXIC', name: 'NASDAQ' },
      { symbol: '^DJI', name: 'DOW JONES' },
    ],
  },
};

const HISTORY_RANGES = {
  '1mo': { days: 31, interval: '1d' },
  '3mo': { days: 93, interval: '1d' },
  '6mo': { days: 186, interval: '1d' },
  '1y': { days: 366, interval: '1d' },
  '2y': { days: 731, interval: '1d' },
  '5y': { days: 1827, interval: '1wk' },
};
export const HISTORY_RANGE_KEYS = Object.keys(HISTORY_RANGES);

/** Upper-case and validate a ticker such as "reliance.ns" -> "RELIANCE.NS". */
export function normalizeSymbol(raw) {
  const symbol = String(raw || '').trim().toUpperCase();
  if (!SYMBOL_PATTERN.test(symbol)) throw ApiError.badRequest(`Invalid symbol "${raw}"`);
  return symbol;
}

/** NSE/BSE tickers and Indian indices are the IN market; everything else is treated as US. */
export function marketOf(symbol) {
  return /\.(NS|BO)$/.test(symbol) || ['^NSEI', '^NSEBANK', '^BSESN'].includes(symbol) ? 'IN' : 'US';
}

function toUpstreamError(error, symbol) {
  const msg = String(error?.message || '');
  if (/not found|no data|delisted|invalid|404/i.test(msg)) {
    return ApiError.notFound(`Unknown symbol: ${symbol}`);
  }
  logger.warn(`Yahoo Finance request failed${symbol ? ` for ${symbol}` : ''}: ${msg}`);
  return ApiError.unavailable('Market data provider is unavailable right now. Please retry shortly.');
}

function normalizeQuote(q) {
  return {
    symbol: q.symbol,
    name: q.longName || q.shortName || q.symbol,
    shortName: q.shortName || q.longName || q.symbol,
    price: q.regularMarketPrice,
    change: q.regularMarketChange ?? null,
    changePercent: q.regularMarketChangePercent ?? null,
    previousClose: q.regularMarketPreviousClose ?? null,
    open: q.regularMarketOpen ?? null,
    dayHigh: q.regularMarketDayHigh ?? null,
    dayLow: q.regularMarketDayLow ?? null,
    volume: q.regularMarketVolume ?? null,
    marketCap: q.marketCap ?? null,
    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? null,
    currency: q.currency || (marketOf(q.symbol) === 'IN' ? 'INR' : 'USD'),
    exchange: q.fullExchangeName || q.exchange || null,
    market: marketOf(q.symbol),
    marketState: q.marketState || null,
    asOf: (q.regularMarketTime ? new Date(q.regularMarketTime) : new Date()).toISOString(),
  };
}

const isUsableQuote = (q) => q && typeof q.regularMarketPrice === 'number' && q.regularMarketPrice > 0;

/** Live quote for one symbol. Throws 404 for unknown tickers, 503 if Yahoo is down. */
export async function getQuote(rawSymbol) {
  const symbol = normalizeSymbol(rawSymbol);
  return cached(`quote:${symbol}`, TTL.quote, async () => {
    let raw;
    try {
      raw = await client.quote(symbol);
    } catch (error) {
      throw toUpstreamError(error, symbol);
    }
    if (!isUsableQuote(raw)) throw ApiError.notFound(`Unknown symbol: ${symbol}`);
    return normalizeQuote(raw);
  });
}

/**
 * Quotes for many symbols in one Yahoo call. Returns a Map(symbol -> quote);
 * symbols Yahoo doesn't know are simply missing from the map.
 */
export async function getQuotes(rawSymbols) {
  const symbols = [...new Set(rawSymbols.map(normalizeSymbol))];
  if (symbols.length === 0) return new Map();

  const key = `quotes:${[...symbols].sort().join(',')}`;
  const list = await cached(key, TTL.quote, async () => {
    let raw;
    try {
      raw = await client.quote(symbols);
    } catch (error) {
      throw toUpstreamError(error);
    }
    return (Array.isArray(raw) ? raw : [raw]).filter(isUsableQuote).map(normalizeQuote);
  });
  return new Map(list.map((q) => [q.symbol, q]));
}

/** Daily (or weekly for 5y) OHLCV candles, oldest first. */
export async function getHistory(rawSymbol, range = '1y') {
  const symbol = normalizeSymbol(rawSymbol);
  const spec = HISTORY_RANGES[range];
  if (!spec) throw ApiError.badRequest(`range must be one of ${HISTORY_RANGE_KEYS.join(', ')}`);

  return cached(`history:${symbol}:${range}`, TTL.history, async () => {
    let result;
    try {
      result = await client.chart(symbol, {
        period1: new Date(Date.now() - spec.days * 24 * 60 * 60 * 1000),
        interval: spec.interval,
      });
    } catch (error) {
      throw toUpstreamError(error, symbol);
    }

    const candles = (result?.quotes || [])
      .filter((c) => typeof c.close === 'number' && c.close > 0)
      .map((c) => ({
        date: new Date(c.date).toISOString(),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume ?? 0,
      }));

    if (candles.length === 0) throw ApiError.notFound(`No price history for ${symbol}`);
    return candles;
  });
}

const US_EXCHANGES = new Set(['NMS', 'NYQ', 'NGM', 'NCM', 'ASE', 'PCX', 'BTS', 'NAS', 'NYS']);

/** Ticker search, optionally restricted to NSE ("IN") or US listings. */
export async function searchSymbols(query, market) {
  const q = String(query || '').trim();
  if (q.length === 0) return [];

  const results = await cached(`search:${q.toLowerCase()}`, TTL.search, async () => {
    try {
      const res = await client.search(q, { quotesCount: 15, newsCount: 0 });
      return (res?.quotes || [])
        .filter((r) => r.symbol && ['EQUITY', 'ETF'].includes(r.quoteType))
        .map((r) => ({
          symbol: r.symbol,
          name: r.longname || r.shortname || r.symbol,
          exchange: r.exchDisp || r.exchange,
          exchangeCode: r.exchange,
          type: r.quoteType,
          market: marketOf(r.symbol),
        }));
    } catch (error) {
      throw toUpstreamError(error);
    }
  });

  return results
    .filter((r) => {
      if (market === 'IN') return r.symbol.endsWith('.NS');
      if (market === 'US') return US_EXCHANGES.has(r.exchangeCode);
      return true;
    })
    .slice(0, 10)
    .map(({ exchangeCode: _code, ...rest }) => rest);
}

/** How many rupees one unit of `currency` buys (1 for INR). Used to settle US trades in INR. */
export async function getFxRateToInr(currency) {
  if (!currency || currency === 'INR') return 1;
  const pair = `${currency}INR=X`;
  return cached(`fx:${pair}`, TTL.fx, async () => {
    let raw;
    try {
      raw = await client.quote(pair);
    } catch (error) {
      throw toUpstreamError(error, pair);
    }
    if (!isUsableQuote(raw)) throw ApiError.unavailable(`FX rate ${pair} unavailable`);
    return raw.regularMarketPrice;
  });
}

/** Top gainers / losers / most active from a fixed universe of large caps. */
export async function getMovers(market = 'IN') {
  const config = MARKETS[market];
  if (!config) throw ApiError.badRequest('market must be IN or US');

  const quotes = [...(await getQuotes(config.universe)).values()].filter(
    (q) => typeof q.changePercent === 'number'
  );
  if (quotes.length === 0) throw ApiError.unavailable('No market data returned');

  const byChange = [...quotes].sort((a, b) => b.changePercent - a.changePercent);
  return {
    market,
    universe: `${quotes.length} large-cap ${config.label} stocks`,
    gainers: byChange.slice(0, 5),
    losers: byChange.slice(-5).reverse(),
    mostActive: [...quotes].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5),
    asOf: new Date().toISOString(),
  };
}

/** Headline index levels for the selected market. */
export async function getIndices(market = 'IN') {
  const config = MARKETS[market];
  if (!config) throw ApiError.badRequest('market must be IN or US');
  const quotes = await getQuotes(config.indices.map((i) => i.symbol));
  return config.indices
    .filter((i) => quotes.has(i.symbol))
    .map((i) => {
      const q = quotes.get(i.symbol);
      return { symbol: i.symbol, name: i.name, price: q.price, change: q.change, changePercent: q.changePercent, currency: q.currency, asOf: q.asOf };
    });
}
