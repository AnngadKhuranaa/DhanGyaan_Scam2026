/** Small, dependency-free statistics helpers shared by the risk engine and confidence score. */

export const TRADING_DAYS_PER_YEAR = 252;

export function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Sample standard deviation (n - 1), the usual estimator for returns. */
export function stdDev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Daily log returns: ln(P_t / P_{t-1}). Additive over time, which is what GBM assumes. */
export function logReturns(closes) {
  const out = [];
  for (let i = 1; i < closes.length; i += 1) {
    if (closes[i - 1] > 0 && closes[i] > 0) out.push(Math.log(closes[i] / closes[i - 1]));
  }
  return out;
}

/** Simple moving average of the last `period` values (null if not enough data). */
export function sma(values, period) {
  if (values.length < period) return null;
  return mean(values.slice(-period));
}

/** Annualised volatility from daily log returns: sigma_daily * sqrt(252). */
export function annualizedVolatility(dailyLogReturns) {
  return stdDev(dailyLogReturns) * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/** Percentile with linear interpolation. `sorted` must be ascending; p in [0, 100]. */
export function percentile(sorted, p) {
  if (sorted.length === 0) return NaN;
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
}

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const round = (value, decimals = 2) => {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
};
