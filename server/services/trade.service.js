import mongoose from 'mongoose';
import User from '../models/User.js';
import Portfolio from '../models/Portfolio.js';
import Trade from '../models/Trade.js';
import ApiError from '../utils/ApiError.js';
import { round } from '../utils/stats.js';
import { getFxRateToInr, getQuote } from './marketData.service.js';

const formatInr = (n) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/**
 * Execute a paper trade at the LIVE price fetched here on the server. The
 * client only says what and how many; any price it sends is ignored.
 *
 * Consistency (the part to explain in an interview):
 * 1. Everything runs inside a MongoDB transaction: the cash change, the
 *    holding change and the trade record commit together or not at all.
 * 2. The cash debit is a conditional atomic update
 *    ({ balance: { $gte: cost } } + $inc), so even two simultaneous buys can't
 *    spend the same rupee twice.
 * 3. If two transactions touch the same portfolio, MongoDB raises a write
 *    conflict and `connection.transaction()` retries the whole callback with
 *    fresh reads, so the average-cost maths always starts from committed data.
 */
export async function executeTrade({ userId, symbol, side, quantity }) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw ApiError.badRequest('Quantity must be a whole number greater than 0');
  }

  // Network calls happen BEFORE the transaction so it stays short.
  const quote = await getQuote(symbol); // 404 for unknown symbols
  const fxRate = await getFxRateToInr(quote.currency);
  const price = quote.price;
  const priceInr = price * fxRate;
  const amountInr = round(priceInr * quantity, 2);

  let trade;
  await mongoose.connection.transaction(async (session) => {
    const portfolio =
      (await Portfolio.findOne({ userId }).session(session)) || new Portfolio({ userId, holdings: [] });
    const index = portfolio.holdings.findIndex((h) => h.symbol === quote.symbol);
    const holding = index >= 0 ? portfolio.holdings[index] : null;
    let realizedPnL = null;
    let balanceChange;

    if (side === 'BUY') {
      balanceChange = -amountInr;
      if (holding) {
        // Weighted average cost: (old cost + new cost) / total shares.
        const newQuantity = holding.quantity + quantity;
        holding.avgCostInr = (holding.avgCostInr * holding.quantity + amountInr) / newQuantity;
        holding.avgPriceNative = (holding.avgPriceNative * holding.quantity + price * quantity) / newQuantity;
        holding.quantity = newQuantity;
      } else {
        portfolio.holdings.push({
          symbol: quote.symbol,
          name: quote.shortName,
          market: quote.market,
          currency: quote.currency,
          quantity,
          avgCostInr: priceInr,
          avgPriceNative: price,
        });
      }
    } else {
      if (!holding || holding.quantity < quantity) {
        const held = holding?.quantity || 0;
        throw ApiError.badRequest(`You hold ${held} share${held === 1 ? '' : 's'} of ${quote.symbol}; cannot sell ${quantity}`);
      }
      balanceChange = amountInr;
      // Realised P&L uses the average cost; selling doesn't change the average.
      realizedPnL = round((priceInr - holding.avgCostInr) * quantity, 2);
      portfolio.realizedPnL = round(portfolio.realizedPnL + realizedPnL, 2);
      holding.quantity -= quantity;
      if (holding.quantity === 0) portfolio.holdings.splice(index, 1);
    }

    // Atomic, conditional cash update: for a buy, only succeeds if the balance covers it.
    const filter = side === 'BUY' ? { _id: userId, balance: { $gte: amountInr } } : { _id: userId };
    const user = await User.findOneAndUpdate(
      filter,
      { $inc: { balance: balanceChange } },
      { new: true, session }
    );
    if (!user) {
      const current = await User.findById(userId).session(session).lean();
      if (!current) throw ApiError.notFound('User not found');
      throw ApiError.badRequest(
        `Insufficient funds: this order costs ${formatInr(amountInr)} but you have ${formatInr(round(current.balance, 2))}`
      );
    }

    await portfolio.save({ session });
    [trade] = await Trade.create(
      [
        {
          userId,
          symbol: quote.symbol,
          name: quote.shortName,
          market: quote.market,
          side,
          quantity,
          price,
          currency: quote.currency,
          fxRate,
          amountInr,
          realizedPnL,
          balanceAfter: round(user.balance, 2),
        },
      ],
      { session }
    );
  });

  return { trade: trade.toObject(), marketState: quote.marketState };
}

/** Paginated trade history with optional filters. */
export async function listTrades(userId, { page = 1, limit = 20, symbol, side, from, to } = {}) {
  const filter = { userId };
  if (symbol) filter.symbol = symbol.toUpperCase();
  if (side) filter.side = side;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const [items, total] = await Promise.all([
    Trade.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Trade.countDocuments(filter),
  ]);

  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
