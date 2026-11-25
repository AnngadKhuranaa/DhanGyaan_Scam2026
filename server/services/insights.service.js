import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { annualizedVolatility, clamp, logReturns, round, sma, stdDev } from '../utils/stats.js';
import { getHistory, getQuote } from './marketData.service.js';
import { getSentiment } from './sentiment.service.js';

/**
 * CONFIDENCE SCORE (0-100): a transparent blend of four signals, each mapped to 0-100.
 *
 *   trend      (30%) = average of
 *                        50 + 50*clamp((price/SMA50 - 1) / 10%, -1, 1)    price vs 50-day average
 *                        50 + 50*clamp((SMA20/SMA50 - 1) / 5%,  -1, 1)    short vs long average
 *   momentum   (25%) = 50 + 50*clamp(return over last 63 trading days / 20%, -1, 1)
 *   volatility (25%) = 100 * (1 - clamp((annualised vol - 15%) / 45%, 0, 1))
 *                      (15% vol or less = 100, 60% or more = 0: calmer scores higher)
 *   sentiment  (20%) = 50 + 50*headline score (-1..+1)
 *
 *   score = sum(weight_i * component_i) / sum(weights of components that are available)
 *
 * If sentiment is demo data (no NewsAPI key), it is EXCLUDED and the other weights
 * are re-normalised, so fake headlines never move a real score.
 * This measures how supportive recent data is. It is not a buy/sell recommendation.
 */
export const WEIGHTS = { trend: 0.3, momentum: 0.25, volatility: 0.25, sentiment: 0.2 };

const toScore = (x) => round(clamp(x, 0, 100), 1);
const pct = (x) => round(x * 100, 2);

/** Pure computation from closes + sentiment so it can be unit tested. */
export function computeConfidence({ closes, price, sentiment }) {
  const current = price ?? closes[closes.length - 1];
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const vsSma50 = current / sma50 - 1;
  const smaSpread = sma20 / sma50 - 1;
  const trend = toScore(
    (50 + 50 * clamp(vsSma50 / 0.1, -1, 1) + (50 + 50 * clamp(smaSpread / 0.05, -1, 1))) / 2
  );

  const lookbackIndex = Math.max(0, closes.length - 64);
  const momentumReturn = current / closes[lookbackIndex] - 1;
  const momentum = toScore(50 + 50 * clamp(momentumReturn / 0.2, -1, 1));

  const vol = annualizedVolatility(logReturns(closes));
  const volatility = toScore(100 * (1 - clamp((vol - 0.15) / 0.45, 0, 1)));

  const components = [
    {
      key: 'trend',
      label: 'Trend',
      weight: WEIGHTS.trend,
      score: trend,
      included: true,
      metrics: { price: round(current, 2), sma20: round(sma20, 2), sma50: round(sma50, 2), priceVsSma50Percent: pct(vsSma50), sma20VsSma50Percent: pct(smaSpread) },
      explanation: `Price is ${Math.abs(pct(vsSma50))}% ${vsSma50 >= 0 ? 'above' : 'below'} its 50-day average and the 20-day average is ${Math.abs(pct(smaSpread))}% ${smaSpread >= 0 ? 'above' : 'below'} the 50-day.`,
    },
    {
      key: 'momentum',
      label: 'Momentum',
      weight: WEIGHTS.momentum,
      score: momentum,
      included: true,
      metrics: { return3mPercent: pct(momentumReturn) },
      explanation: `${momentumReturn >= 0 ? 'Up' : 'Down'} ${Math.abs(pct(momentumReturn))}% over the last ~3 months (63 trading days).`,
    },
    {
      key: 'volatility',
      label: 'Volatility',
      weight: WEIGHTS.volatility,
      score: volatility,
      included: true,
      metrics: { annualizedVolatilityPercent: pct(vol) },
      explanation: `Annualised volatility is ${pct(vol)}% (15% or less scores 100, 60% or more scores 0).`,
    },
  ];

  const sentimentUsable = sentiment && !sentiment.demo && sentiment.headlines?.length > 0;
  components.push({
    key: 'sentiment',
    label: 'News sentiment',
    weight: WEIGHTS.sentiment,
    score: sentiment ? toScore(50 + 50 * sentiment.score) : null,
    included: Boolean(sentimentUsable),
    metrics: sentiment ? { score: sentiment.score, headlines: sentiment.headlines?.length || 0, demo: Boolean(sentiment.demo) } : {},
    explanation: sentimentUsable
      ? `Average headline score ${sentiment.score} across ${sentiment.headlines.length} recent headlines.`
      : 'Excluded: no real headlines available (demo data or NewsAPI not configured). Other weights re-normalised.',
  });

  const used = components.filter((c) => c.included);
  const totalWeight = used.reduce((s, c) => s + c.weight, 0);
  const score = round(used.reduce((s, c) => s + c.weight * c.score, 0) / totalWeight, 1);
  for (const c of components) {
    c.effectiveWeight = c.included ? round(c.weight / totalWeight, 3) : 0;
    c.contribution = c.included ? round((c.weight / totalWeight) * c.score, 1) : 0;
  }

  return {
    score,
    label: score >= 65 ? 'Favourable' : score >= 40 ? 'Mixed' : 'Weak',
    components,
    formula: 'score = Σ(weight × component) / Σ(weights used); trend 30%, momentum 25%, volatility 25%, sentiment 20%',
  };
}

export async function getConfidence(symbol) {
  const [history, quote] = await Promise.all([getHistory(symbol, '1y'), getQuote(symbol)]);
  let sentiment = null;
  try {
    sentiment = await getSentiment(symbol);
  } catch (error) {
    logger.warn(`Sentiment unavailable for confidence(${symbol}): ${error.message}`);
  }

  const closes = history.map((c) => c.close);
  if (closes.length < 64) {
    throw ApiError.badRequest(`Not enough history for ${quote.symbol} (need ~3 months)`);
  }

  return {
    symbol: quote.symbol,
    name: quote.shortName,
    currency: quote.currency,
    asOf: quote.asOf,
    ...computeConfidence({ closes, price: quote.price, sentiment }),
    sentimentDemo: Boolean(sentiment?.demo),
    disclaimer: 'Educational indicator built from past prices and headlines. Not financial advice.',
  };
}

/**
 * EXIT COACH: rule-based levels from real prices.
 *   stop loss   = entry * exp(-2 * dailyVol * sqrt(10))   (a ~2-sigma move over two weeks)
 *   target 1/2  = entry + 2R / 3R, where R = entry - stop  (2:1 and 3:1 reward-to-risk)
 *   support     = lowest low of last 20 / 50 days; resistance = highest high of last 20 / 50 days
 */
export async function getExitPlan(symbol, entryPrice) {
  const [history, quote] = await Promise.all([getHistory(symbol, '6mo'), getQuote(symbol)]);
  const entry = entryPrice ?? quote.price;
  const dailyVol = stdDev(logReturns(history.map((c) => c.close)));

  const stopLoss = entry * Math.exp(-2 * dailyVol * Math.sqrt(10));
  const risk = entry - stopLoss;
  const last = (n) => history.slice(-n);
  const low = (n) => Math.min(...last(n).map((c) => c.low ?? c.close));
  const high = (n) => Math.max(...last(n).map((c) => c.high ?? c.close));

  const current = quote.price;
  const fromEntry = (current / entry - 1) * 100;
  let action;
  if (current <= stopLoss) action = { tone: 'negative', text: 'Price is at or below the volatility stop. A disciplined plan would exit or re-assess the thesis.' };
  else if (current >= entry + 2 * risk) action = { tone: 'positive', text: 'First target reached. Consider booking partial profit and trailing the stop up to entry.' };
  else if (fromEntry < -3) action = { tone: 'warning', text: 'Position is under water but above the stop. Hold only if the original reason for buying still holds.' };
  else action = { tone: 'neutral', text: 'Within the normal range for this stock’s volatility. Let the plan work and watch the levels below.' };

  return {
    symbol: quote.symbol,
    currency: quote.currency,
    entry: round(entry),
    current: round(current),
    changeFromEntryPercent: round(fromEntry),
    dailyVolatilityPercent: round(dailyVol * 100, 2),
    stopLoss: round(stopLoss),
    stopLossPercent: round((stopLoss / entry - 1) * 100),
    target1: round(entry + 2 * risk),
    target2: round(entry + 3 * risk),
    support: { days20: round(low(20)), days50: round(low(50)) },
    resistance: { days20: round(high(20)), days50: round(high(50)) },
    action,
    method: 'Stop = entry × e^(−2σ√10) (≈2σ two-week move); targets at 2R and 3R; support/resistance = 20/50-day lows/highs.',
  };
}
