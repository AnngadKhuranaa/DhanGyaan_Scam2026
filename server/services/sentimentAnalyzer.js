import SentimentCache from '../models/SentimentCache.js';
import logger from '../utils/logger.js';

const CACHE_TTL_HOURS = 2;

/**
 * Get sentiment for a stock symbol.
 * Uses MongoDB TTL cache to avoid repeated API calls.
 */
export const getSentiment = async (symbol) => {
  symbol = symbol.toUpperCase();

  // Check DB cache first
  const cached = await SentimentCache.findOne({ symbol, expiresAt: { $gt: new Date() } });
  if (cached) {
    logger.debug(`Sentiment cache HIT for ${symbol}`);
    return cached;
  }

  // Fetch fresh data
  const [tweets, news] = await Promise.allSettled([
    fetchTweets(symbol),
    fetchNews(symbol),
  ]);

  const tweetData = tweets.status === 'fulfilled' ? tweets.value : [];
  const newsData = news.status === 'fulfilled' ? news.value : [];

  const allTexts = [...tweetData, ...newsData];
  const score = computeSentimentScore(allTexts);

  const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000);

  const result = await SentimentCache.findOneAndUpdate(
    { symbol },
    {
      symbol,
      sentimentScore: score,
      sentimentLabel: scoreToLabel(score),
      tweets: tweetData,
      news: newsData,
      cachedAt: new Date(),
      expiresAt,
    },
    { upsert: true, new: true }
  );

  return result;
};

/**
 * Fetch tweets mentioning the symbol via Twitter API v2
 */
const fetchTweets = async (symbol) => {
  if (!process.env.TWITTER_BEARER_TOKEN) return [];

  try {
    const { TwitterApi } = await import('twitter-api-v2');
    const client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN);
    const query = `${symbol} stock -is:retweet lang:en`;
    const response = await client.v2.search(query, { max_results: 20 });
    return (response.data?.data || []).map((t) => ({
      text: t.text,
      author: t.author_id,
      sentiment: simpleSentiment(t.text),
      createdAt: new Date(),
    }));
  } catch (err) {
    logger.warn(`Twitter fetch failed for ${symbol}: ${err.message}`);
    return [];
  }
};

/**
 * Fetch news via NewsAPI
 */
const fetchNews = async (symbol) => {
  if (!process.env.NEWS_API_KEY) return [];

  try {
    const NewsAPI = (await import('newsapi')).default;
    const newsapi = new NewsAPI(process.env.NEWS_API_KEY);
    const response = await newsapi.v2.everything({
      q: symbol,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: 10,
    });
    return (response.articles || []).map((a) => ({
      title: a.title,
      source: a.source?.name,
      url: a.url,
      sentiment: simpleSentiment(a.title),
      publishedAt: new Date(a.publishedAt),
    }));
  } catch (err) {
    logger.warn(`News fetch failed for ${symbol}: ${err.message}`);
    return [];
  }
};

/**
 * Simple keyword-based sentiment scorer
 */
const POSITIVE = ['bullish', 'surge', 'rally', 'gain', 'up', 'profit', 'buy', 'growth', 'positive', 'rise'];
const NEGATIVE = ['bearish', 'crash', 'fall', 'loss', 'down', 'sell', 'drop', 'decline', 'negative', 'risk'];

const simpleSentiment = (text = '') => {
  const lower = text.toLowerCase();
  const pos = POSITIVE.filter((w) => lower.includes(w)).length;
  const neg = NEGATIVE.filter((w) => lower.includes(w)).length;
  if (pos > neg) return 'BULLISH';
  if (neg > pos) return 'BEARISH';
  return 'NEUTRAL';
};

const computeSentimentScore = (items) => {
  if (!items.length) return 0;
  const scores = items.map((i) => {
    const s = i.sentiment || simpleSentiment(i.text || i.title || '');
    return s === 'BULLISH' ? 1 : s === 'BEARISH' ? -1 : 0;
  });
  return +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
};

const scoreToLabel = (score) => {
  if (score > 0.2) return 'BULLISH';
  if (score < -0.2) return 'BEARISH';
  return 'NEUTRAL';
};
