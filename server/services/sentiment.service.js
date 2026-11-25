import NewsAPI from 'newsapi';
import SentimentCache from '../models/SentimentCache.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';
import { getQuote, normalizeSymbol } from './marketData.service.js';
import { aggregate, scoreText } from './sentimentScorer.js';

const CACHE_MINUTES = 30; // NewsAPI's free plan allows ~100 requests/day
const MAX_HEADLINES = 15;

let newsClientFactory = (key) => new NewsAPI(key);

/** Test hook: replace the NewsAPI client. */
export function setNewsClientFactory(factory) {
  newsClientFactory = factory;
}

/** "Reliance Industries Limited" -> "Reliance Industries" (better search recall). */
export function companyQuery(name, symbol) {
  const cleaned = String(name || '')
    .replace(/\b(limited|ltd\.?|inc\.?|incorporated|corporation|corp\.?|plc|co\.?|company|holdings?|the)\b/gi, '')
    .replace(/[.,&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || symbol.replace(/\.(NS|BO)$/, '');
}

/**
 * Clearly marked sample headlines, used ONLY when NewsAPI isn't configured or fails.
 * They run through the same scorer so the pipeline is still demonstrated, and the
 * response carries demo: true so the UI shows a "Demo data" badge.
 */
function demoSentiment(symbol, query, reason) {
  const samples = [
    `Sample headline: ${query} shares rise after strong quarterly results`,
    `Sample headline: Analysts warn of slowdown risks for ${query}`,
    `Sample headline: ${query} announces new partnership`,
  ];
  const headlines = samples.map((title) => ({ title, source: 'Demo data', url: null, publishedAt: null, ...scoreText(title) }));
  return { symbol, query, ...aggregate(headlines), headlines, demo: true, demoReason: reason, fetchedAt: new Date().toISOString() };
}

/** Headline sentiment for a symbol: cached in MongoDB, scored deterministically. */
export async function getSentiment(rawSymbol) {
  const symbol = normalizeSymbol(rawSymbol);

  let name = symbol;
  try {
    name = (await getQuote(symbol)).name;
  } catch (error) {
    if (error.statusCode === 404) throw error; // unknown ticker
  }
  const query = companyQuery(name, symbol);

  const { newsApiKey } = env();
  if (!newsApiKey) return demoSentiment(symbol, query, 'NEWS_API_KEY is not configured on the server');

  const cachedDoc = await SentimentCache.findOne({ symbol, expiresAt: { $gt: new Date() } }).lean();
  if (cachedDoc) return toResponse(cachedDoc, true);

  let articles;
  try {
    const client = newsClientFactory(newsApiKey);
    const res = await client.v2.everything({
      q: `"${query}"`,
      searchIn: 'title',
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: 30,
      from: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    if (res.status !== 'ok') throw new Error(res.message || res.code || 'NewsAPI error');
    articles = res.articles || [];
  } catch (error) {
    logger.warn(`NewsAPI failed for ${symbol}: ${error.message}`);
    return demoSentiment(symbol, query, 'NewsAPI is unavailable right now');
  }

  const seen = new Set();
  const headlines = [];
  for (const a of articles) {
    const title = (a.title || '').trim();
    const key = title.toLowerCase();
    if (!title || title === '[Removed]' || seen.has(key)) continue;
    seen.add(key);
    headlines.push({
      title,
      source: a.source?.name || 'Unknown',
      url: a.url || null,
      publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
      ...scoreText(title),
    });
    if (headlines.length >= MAX_HEADLINES) break;
  }

  const summary = aggregate(headlines);
  const doc = await SentimentCache.findOneAndUpdate(
    { symbol },
    {
      symbol,
      query,
      ...summary,
      headlines,
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() + CACHE_MINUTES * 60 * 1000),
    },
    { upsert: true, new: true, lean: true }
  );
  return toResponse(doc, false);
}

function toResponse(doc, fromCache) {
  return {
    symbol: doc.symbol,
    query: doc.query,
    score: doc.score,
    label: doc.label,
    counts: doc.counts,
    headlines: doc.headlines,
    demo: false,
    cached: fromCache,
    fetchedAt: new Date(doc.fetchedAt).toISOString(),
  };
}
