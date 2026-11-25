/**
 * Monte Carlo Risk Engine
 * Simulates future price paths using Geometric Brownian Motion
 */

/**
 * Run Monte Carlo simulation
 * @param {number} currentPrice   - Current stock price
 * @param {number} mu             - Expected annual return (e.g. 0.12 = 12%)
 * @param {number} sigma          - Annual volatility (e.g. 0.25 = 25%)
 * @param {number} days           - Forecast horizon in trading days
 * @param {number} simulations    - Number of simulation paths
 * @returns {object} Simulation results
 */
export const runMonteCarlo = (
  currentPrice,
  mu = 0.1,
  sigma = 0.25,
  days = 252,
  simulations = 1000
) => {
  const dt = 1 / 252; // daily step
  const paths = [];
  const finalPrices = [];

  for (let s = 0; s < simulations; s++) {
    let price = currentPrice;
    const path = [price];

    for (let d = 0; d < days; d++) {
      const drift = (mu - 0.5 * sigma ** 2) * dt;
      const shock = sigma * Math.sqrt(dt) * randomNormal();
      price = price * Math.exp(drift + shock);
      path.push(+price.toFixed(2));
    }

    paths.push(path);
    finalPrices.push(price);
  }

  finalPrices.sort((a, b) => a - b);

  const lossProbability =
    (finalPrices.filter((p) => p < currentPrice).length / simulations) * 100;

  return {
    currentPrice,
    mu,
    sigma,
    days,
    simulations,
    // Return a sample of 50 paths for chart rendering
    samplePaths: paths.slice(0, 50),
    statistics: {
      mean: mean(finalPrices),
      median: percentile(finalPrices, 50),
      p5: percentile(finalPrices, 5),   // worst 5%
      p25: percentile(finalPrices, 25),
      p75: percentile(finalPrices, 75),
      p95: percentile(finalPrices, 95), // best 5%
      lossProbability: +lossProbability.toFixed(2),
      expectedReturn: +(((mean(finalPrices) - currentPrice) / currentPrice) * 100).toFixed(2),
    },
  };
};

/**
 * Calculate Value at Risk (VaR) at given confidence level
 */
export const calcVaR = (currentPrice, sigma, confidence = 0.95, days = 1) => {
  const z = confidence === 0.99 ? 2.326 : 1.645; // z-score
  const var_ = currentPrice * sigma * Math.sqrt(days / 252) * z;
  return { var: +var_.toFixed(2), confidence, days };
};

// ── Helpers ─────────────────────────────────────
const randomNormal = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;

const percentile = (sorted, p) => {
  const idx = Math.floor((p / 100) * sorted.length);
  return +sorted[Math.min(idx, sorted.length - 1)].toFixed(2);
};
