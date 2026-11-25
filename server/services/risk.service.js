import ApiError from '../utils/ApiError.js';
import { TRADING_DAYS_PER_YEAR, logReturns, mean, percentile, round, stdDev } from '../utils/stats.js';
import { getHistory, getQuote } from './marketData.service.js';

/**
 * Monte Carlo risk engine (geometric Brownian motion).
 *
 * 1. Calibrate on real history: take daily closes, compute log returns
 *    r_t = ln(P_t / P_{t-1}), and estimate m = mean(r), s = stdev(r).
 * 2. Simulate: under GBM, each day's log return is normally distributed, so
 *        V_{t+1} = V_t * exp(m + s * Z),   Z ~ N(0, 1)
 *    (This is GBM with drift mu = m + s^2/2; using m directly already includes
 *    the -s^2/2 "volatility drag", so we don't subtract it twice.)
 * 3. Repeat for N paths over H trading days and read off the distribution of
 *    final values: percentiles, probability of loss, VaR and CVaR.
 *
 * Assumptions (shown in the UI): returns are i.i.d. normal in log space,
 * constant volatility, no fat tails or jumps, the past year or two is
 * representative, and no fees or dividends. It is a model, not a forecast.
 */

/** Small, fast, seedable PRNG (mulberry32) so a run can be reproduced exactly. */
export function createRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample via the Box-Muller transform. */
export function createNormal(rng) {
  let spare = null;
  return () => {
    if (spare !== null) {
      const z = spare;
      spare = null;
      return z;
    }
    let u = 0;
    while (u === 0) u = rng();
    const v = rng();
    const mag = Math.sqrt(-2 * Math.log(u));
    spare = mag * Math.sin(2 * Math.PI * v);
    return mag * Math.cos(2 * Math.PI * v);
  };
}

const FAN_PERCENTILES = [5, 25, 50, 75, 95];
const MAX_CHART_POINTS = 60;
const SAMPLE_PATHS = 12;

/**
 * Pure simulation (no I/O) so it can be unit-tested with known parameters.
 * @param {object} p
 * @param {number} p.amount       starting value invested
 * @param {number} p.dailyMean    m, mean daily log return
 * @param {number} p.dailyStd     s, stdev of daily log returns
 * @param {number} p.horizonDays  trading days to simulate
 * @param {number} p.paths        number of simulated paths
 * @param {number} p.seed         PRNG seed
 */
export function runSimulation({ amount, dailyMean, dailyStd, horizonDays, paths, seed }) {
  const normal = createNormal(createRng(seed));

  // Record the portfolio value on ~60 evenly spaced days for the fan chart.
  const step = Math.max(1, Math.ceil(horizonDays / MAX_CHART_POINTS));
  const checkpoints = [];
  for (let d = step; d < horizonDays; d += step) checkpoints.push(d);
  checkpoints.push(horizonDays);

  const valuesAt = checkpoints.map(() => new Float64Array(paths));
  const finals = new Float64Array(paths);
  const samplePaths = [];

  for (let p = 0; p < paths; p += 1) {
    let value = amount;
    let c = 0;
    const sample = p < SAMPLE_PATHS ? [amount] : null;
    for (let day = 1; day <= horizonDays; day += 1) {
      value *= Math.exp(dailyMean + dailyStd * normal());
      if (day === checkpoints[c]) {
        valuesAt[c][p] = value;
        if (sample) sample.push(round(value));
        c += 1;
      }
    }
    finals[p] = value;
    if (sample) samplePaths.push(sample);
  }

  const sorted = Float64Array.from(finals).sort();
  const pct = (q) => percentile(sorted, q);

  const fan = [{ day: 0, ...Object.fromEntries(FAN_PERCENTILES.map((q) => [`p${q}`, amount])) }];
  checkpoints.forEach((day, i) => {
    const s = valuesAt[i].sort();
    fan.push({ day, ...Object.fromEntries(FAN_PERCENTILES.map((q) => [`p${q}`, round(percentile(s, q))])) });
  });

  const p5 = pct(5);
  const tail = sorted.filter((v) => v <= p5);
  const lossCount = sorted.reduce((n, v) => n + (v < amount ? 1 : 0), 0);
  // VaR95: the loss you'd exceed in only 5% of outcomes. CVaR95: the average loss in that worst 5%.
  const var95 = Math.max(0, amount - p5);
  const cvar95 = Math.max(0, amount - mean(Array.from(tail)));

  return {
    outcomes: {
      best: round(pct(95)),
      median: round(pct(50)),
      worst: round(p5),
      mean: round(mean(Array.from(sorted))),
      p25: round(pct(25)),
      p75: round(pct(75)),
      min: round(sorted[0]),
      max: round(sorted[sorted.length - 1]),
    },
    probabilityOfLoss: round((lossCount / paths) * 100),
    var95: round(var95),
    var95Percent: round((var95 / amount) * 100),
    cvar95: round(cvar95),
    fan,
    samplePaths: { days: [0, ...checkpoints], values: samplePaths },
  };
}

function riskLevel(var95Percent) {
  if (var95Percent < 10) return 'Low';
  if (var95Percent < 25) return 'Medium';
  return 'High';
}

/** Calibrate on real history, then simulate. */
export async function simulateRisk({ symbol, amount, horizonDays = 252, paths = 2000, lookback = '2y', seed }) {
  const [history, quote] = await Promise.all([getHistory(symbol, lookback), getQuote(symbol)]);
  const returns = logReturns(history.map((c) => c.close));
  if (returns.length < 60) {
    throw ApiError.badRequest(`Not enough price history for ${symbol} to calibrate (need 60+ trading days)`);
  }

  const dailyMean = mean(returns);
  const dailyStd = stdDev(returns);
  const usedSeed = Number.isInteger(seed) ? seed : Math.floor(Math.random() * 2 ** 31); // only the seed is random
  const result = runSimulation({ amount, dailyMean, dailyStd, horizonDays, paths, seed: usedSeed });

  return {
    symbol: quote.symbol,
    name: quote.shortName,
    currency: quote.currency,
    inputs: { amount, horizonDays, paths, lookback, seed: usedSeed },
    calibration: {
      observations: returns.length,
      from: history[0].date,
      to: history[history.length - 1].date,
      dailyMeanLogReturn: dailyMean,
      dailyVolatility: dailyStd,
      annualizedReturnPercent: round((Math.exp((dailyMean + dailyStd ** 2 / 2) * TRADING_DAYS_PER_YEAR) - 1) * 100),
      annualizedVolatilityPercent: round(dailyStd * Math.sqrt(TRADING_DAYS_PER_YEAR) * 100),
      lastClose: history[history.length - 1].close,
    },
    ...result,
    riskLevel: riskLevel(result.var95Percent),
    assumptions: [
      'Daily log returns are normally distributed with the mean and volatility measured over the lookback window.',
      'Volatility is constant; real markets have volatility clusters, gaps and fat tails, so extreme losses are understated.',
      'No dividends, fees, taxes or currency moves are included.',
      'Past behaviour is not a forecast. This is an educational model, not investment advice.',
    ],
  };
}
