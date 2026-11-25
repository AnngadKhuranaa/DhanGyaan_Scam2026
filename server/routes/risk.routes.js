import express from 'express';

const router = express.Router();

const mockHistoricalReturns = {
  TCS: [0.012, 0.018, -0.01, 0.022, 0.009, -0.006, 0.014, 0.017],
  INFOSYS: [0.01, -0.008, 0.013, 0.019, -0.012, 0.011, 0.015, 0.007],
  RELIANCE: [0.016, 0.021, -0.014, 0.012, 0.008, -0.009, 0.02, 0.011],
  DEFAULT: [0.01, 0.014, -0.011, 0.017, 0.006, -0.007, 0.013, 0.009],
};

function calculateMean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateStdDev(values, mean) {
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

function normalCdf(value) {
  const sign = value < 0 ? -1 : 1;
  const absolute = Math.abs(value) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * absolute);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const erf =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absolute * absolute));

  return 0.5 * (1 + sign * erf);
}

router.post('/loss', (req, res) => {
  const { stock, amount, duration } = req.body;

  if (!stock || !amount || !duration) {
    return res.status(400).json({ message: 'stock, amount, and duration are required' });
  }

  const normalizedStock = String(stock).toUpperCase();
  const principal = Number(amount);
  const months = Number(duration);

  if (Number.isNaN(principal) || Number.isNaN(months) || principal <= 0 || months <= 0) {
    return res
      .status(400)
      .json({ message: 'amount and duration must be valid positive numbers' });
  }

  const returns = mockHistoricalReturns[normalizedStock] || mockHistoricalReturns.DEFAULT;
  const mean = calculateMean(returns);
  const stdDev = calculateStdDev(returns, mean);

  const projectedMean = mean * months;
  const projectedStdDev = stdDev * Math.sqrt(months);
  const zScore = (0 - projectedMean) / (projectedStdDev || 1);
  const lossProbability = normalCdf(zScore) * 100;
  const expectedReturn = principal * projectedMean;

  return res.json({
    stock: normalizedStock,
    amount: principal,
    duration: months,
    probability: `${lossProbability.toFixed(2)}%`,
    expectedReturn: Number(expectedReturn.toFixed(2)),
  });
});

export default router;
