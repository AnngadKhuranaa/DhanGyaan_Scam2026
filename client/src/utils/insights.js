// ─── Currency formatting & conversion ────────────────────────
const USD_TO_INR = 83.5;

/**
 * Format a number as Indian Rupee or US Dollar.
 * @param {number} value — raw numeric value
 * @param {string} currency — 'INR' | 'USD'
 * @returns {string} formatted string like ₹1,23,456 or $1,500
 */
export function formatCurrency(value, currency = 'INR') {
  if (value == null || isNaN(value)) return currency === 'INR' ? '₹0' : '$0';

  const num = currency === 'INR' ? value : value;

  if (currency === 'INR') {
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Convert USD to INR.
 */
export function usdToInr(usd) {
  return Math.round(usd * USD_TO_INR);
}

/**
 * Format a compact number (e.g. 1.2L, 15.3Cr)
 */
export function formatCompact(value, currency = 'INR') {
  if (currency === 'INR') {
    if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`;
    if (value >= 1e5) return `₹${(value / 1e5).toFixed(1)}L`;
    if (value >= 1e3) return `₹${(value / 1e3).toFixed(1)}K`;
    return `₹${value}`;
  }
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value}`;
}

// ─── Dynamic insight generators ──────────────────────────────

/**
 * Generate insights for portfolio growth chart.
 */
export function generatePortfolioInsight({ totalInvested, totalValue, cagr, years }) {
  const wealthMultiple = (totalValue / totalInvested).toFixed(1);
  const insights = [];

  if (Number(cagr) >= 15) {
    insights.push(`A ${cagr}% CAGR is excellent — your money grows ${wealthMultiple}x in ${years} years, beating most fixed-income instruments.`);
  } else if (Number(cagr) >= 10) {
    insights.push(`With ${cagr}% CAGR, your portfolio grows ${wealthMultiple}x — solid growth that outpaces inflation significantly.`);
  } else {
    insights.push(`A ${cagr}% CAGR suggests conservative growth. Consider equities or SIP to boost long-term returns.`);
  }

  if (totalValue > totalInvested * 2) {
    insights.push(`Compounding has doubled your investment. The longer you stay, the more exponential the growth.`);
  }

  if (years >= 10) {
    insights.push(`Long-term investing significantly reduces volatility impact and smooths out market cycles.`);
  }

  return insights.slice(0, 3);
}

/**
 * Generate insights for worst case simulation.
 */
export function generateRiskInsight({ dropPct, loss, recovery, scenarioName }) {
  const insights = [];
  const absDrop = Math.abs(dropPct);

  if (absDrop >= 40) {
    insights.push(`In a ${scenarioName} scenario, your portfolio faces severe drawdown (${dropPct}%). Diversification is critical.`);
  } else if (absDrop >= 25) {
    insights.push(`A ${absDrop}% drop is painful but historically recoverable. Avoid panic selling during corrections.`);
  } else {
    insights.push(`A ${absDrop}% correction is part of normal market cycles. Staying invested typically yields recovery within ${recovery}.`);
  }

  insights.push(`High-volatility stocks amplify losses in bear markets — consider hedging with index funds or bonds.`);

  if (loss > 100000) {
    insights.push(`Potential loss of ${formatCurrency(loss)} underscores the need for an emergency fund separate from investments.`);
  }

  return insights.slice(0, 3);
}

/**
 * Generate insights for confidence breakdown.
 */
export function generateConfidenceInsight({ overall, sentiment, volatility, trend, riskLevel }) {
  const insights = [];

  if (overall >= 70) {
    insights.push(`Strong confidence score of ${overall}/100. Market conditions align favorably for this stock.`);
  } else if (overall >= 45) {
    insights.push(`Moderate confidence (${overall}/100). Proceed with caution — mixed signals detected.`);
  } else {
    insights.push(`Low confidence (${overall}/100). High uncertainty — consider waiting for clearer signals.`);
  }

  if (sentiment > 70 && volatility < 50) {
    insights.push(`Positive sentiment with low volatility is a healthy combination for momentum plays.`);
  } else if (sentiment < 40) {
    insights.push(`Weak sentiment may indicate broader market concern. Monitor news flow closely.`);
  }

  if (trend > 60) {
    insights.push(`Strong trend strength supports the thesis. Technical momentum is in your favor.`);
  }

  return insights.slice(0, 3);
}

/**
 * Generate insights for exit coach strategy.
 */
export function generateExitInsight({ entry, stopLoss, target1, rrRatio }) {
  const insights = [];
  const riskPct = (((entry - stopLoss) / entry) * 100).toFixed(1);
  const rewardPct = (((target1 - entry) / entry) * 100).toFixed(1);

  insights.push(`Risk-reward ratio of 1:${rrRatio} — ${Number(rrRatio) >= 2 ? 'favourable for this trade.' : 'consider tighter entry or wider target.'}`);
  insights.push(`Stop loss at ${riskPct}% below entry limits your downside while allowing ${rewardPct}% upside room.`);
  insights.push(`Always trail your stop loss upward as the position moves in your favor to lock in gains.`);

  return insights;
}

export const USD_INR_RATE = USD_TO_INR;
