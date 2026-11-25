function calculateDailyReturns(priceHistory) {
  const closes = priceHistory
    .map((item) => item.close)
    .filter((price) => typeof price === 'number' && price > 0);

  const dailyReturns = [];

  for (let index = 1; index < closes.length; index += 1) {
    const previousClose = closes[index - 1];
    const currentClose = closes[index];
    dailyReturns.push((currentClose - previousClose) / previousClose);
  }

  return dailyReturns;
}

function calculateMean(values) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateStdDev(values, mean) {
  if (values.length === 0) {
    return 0;
  }

  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

function generateNormalRandom() {
  let u1 = 0;
  let u2 = 0;

  while (u1 === 0) {
    u1 = Math.random();
  }

  while (u2 === 0) {
    u2 = Math.random();
  }

  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function runMonteCarloSimulation(priceHistory, amount, duration) {
  const investmentAmount = Number(amount);
  const durationMonths = Number(duration);

  if (!Array.isArray(priceHistory) || priceHistory.length < 2) {
    throw new Error('Not enough price history to run simulation');
  }

  if (
    Number.isNaN(investmentAmount) ||
    Number.isNaN(durationMonths) ||
    investmentAmount <= 0 ||
    durationMonths <= 0
  ) {
    throw new Error('Amount and duration must be valid positive numbers');
  }

  const dailyReturns = calculateDailyReturns(priceHistory);
  const mean = calculateMean(dailyReturns);
  const stdDev = calculateStdDev(dailyReturns, mean);
  const tradingDays = Math.max(1, Math.round(durationMonths * 21));

  const outcomes = Array.from({ length: 1000 }, () => {
    let simulatedValue = investmentAmount;

    for (let day = 0; day < tradingDays; day += 1) {
      const randomReturn = mean + stdDev * generateNormalRandom();
      simulatedValue *= 1 + randomReturn;
    }

    return simulatedValue;
  });

  const best = Math.max(...outcomes);
  const worst = Math.min(...outcomes);
  const average = outcomes.reduce((sum, value) => sum + value, 0) / outcomes.length;
  const probabilityOfLoss =
    (outcomes.filter((value) => value < investmentAmount).length / outcomes.length) * 100;

  return {
    best: Number(best.toFixed(2)),
    worst: Number(worst.toFixed(2)),
    average: Number(average.toFixed(2)),
    probabilityOfLoss: Number(probabilityOfLoss.toFixed(2)),
  };
}
