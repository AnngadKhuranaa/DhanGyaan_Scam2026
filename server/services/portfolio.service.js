import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { round } from '../utils/stats.js';
import { getFxRateToInr, getQuotes } from './marketData.service.js';

/**
 * Load live prices for a set of holdings. If Yahoo is down we don't fail the
 * whole page: affected holdings are valued at cost and flagged `priceStale`
 * so the UI can say so, instead of inventing a price.
 */
export async function priceHoldings(holdings) {
  if (holdings.length === 0) return { quotes: new Map(), fx: new Map(), stale: false };

  let quotes = new Map();
  const fx = new Map([['INR', 1]]);
  let stale = false;
  try {
    quotes = await getQuotes(holdings.map((h) => h.symbol));
    for (const currency of new Set(holdings.map((h) => h.currency))) {
      if (!fx.has(currency)) fx.set(currency, await getFxRateToInr(currency));
    }
  } catch (error) {
    logger.warn(`Pricing holdings failed, valuing at cost: ${error.message}`);
    stale = true;
  }
  return { quotes, fx, stale };
}

/** Value one holding in INR. Pure function: easy to unit test. */
export function valueHolding(holding, quote, fxRate) {
  const costInr = holding.avgCostInr * holding.quantity;
  const priced = Boolean(quote && fxRate);
  const currentPrice = priced ? quote.price : holding.avgPriceNative;
  const marketValueInr = priced ? quote.price * fxRate * holding.quantity : costInr;
  const unrealizedPnL = marketValueInr - costInr;

  return {
    symbol: holding.symbol,
    name: holding.name,
    market: holding.market,
    currency: holding.currency,
    quantity: holding.quantity,
    avgPrice: round(holding.avgPriceNative, 4),
    avgCostInr: round(holding.avgCostInr, 4),
    currentPrice: round(currentPrice, 4),
    dayChangePercent: priced ? quote.changePercent : null,
    costInr: round(costInr),
    marketValueInr: round(marketValueInr),
    unrealizedPnL: round(unrealizedPnL),
    unrealizedPnLPercent: costInr > 0 ? round((unrealizedPnL / costInr) * 100) : 0,
    priceStale: !priced,
  };
}

/**
 * Full portfolio summary, all money in INR.
 *   totalValue    = cash + market value of holdings
 *   totalPnL      = realised + unrealised   (== totalValue - startingBalance)
 *   totalReturn % = (totalValue - startingBalance) / startingBalance
 */
export async function getPortfolioSummary(userId) {
  const [user, portfolio] = await Promise.all([
    User.findById(userId).lean(),
    Portfolio.findOne({ userId }).lean(),
  ]);
  if (!user) throw ApiError.notFound('User not found');

  const rawHoldings = portfolio?.holdings || [];
  const { quotes, fx, stale } = await priceHoldings(rawHoldings);
  const holdings = rawHoldings.map((h) => valueHolding(h, quotes.get(h.symbol), fx.get(h.currency)));

  const cash = user.balance;
  const holdingsValue = holdings.reduce((sum, h) => sum + h.marketValueInr, 0);
  const invested = holdings.reduce((sum, h) => sum + h.costInr, 0);
  const unrealizedPnL = holdings.reduce((sum, h) => sum + h.unrealizedPnL, 0);
  const realizedPnL = portfolio?.realizedPnL || 0;
  const totalValue = cash + holdingsValue;

  for (const h of holdings) {
    h.allocationPercent = totalValue > 0 ? round((h.marketValueInr / totalValue) * 100) : 0;
  }
  holdings.sort((a, b) => b.marketValueInr - a.marketValueInr);

  return {
    currency: 'INR',
    startingBalance: user.startingBalance,
    cash: round(cash),
    holdingsValue: round(holdingsValue),
    invested: round(invested),
    unrealizedPnL: round(unrealizedPnL),
    realizedPnL: round(realizedPnL),
    totalPnL: round(unrealizedPnL + realizedPnL),
    totalValue: round(totalValue),
    totalReturnPercent: user.startingBalance > 0 ? round(((totalValue - user.startingBalance) / user.startingBalance) * 100) : 0,
    holdings,
    allocation: [
      ...holdings.map((h) => ({ name: h.symbol, value: h.marketValueInr, percent: h.allocationPercent })),
      { name: 'Cash', value: round(cash), percent: totalValue > 0 ? round((cash / totalValue) * 100) : 100 },
    ],
    pricesStale: stale || holdings.some((h) => h.priceStale),
    asOf: new Date().toISOString(),
  };
}

/** The user's position in one symbol (used to give the AI explainer context). */
export async function getPosition(userId, symbol) {
  const portfolio = await Portfolio.findOne({ userId }).lean();
  return portfolio?.holdings.find((h) => h.symbol === symbol) || null;
}
