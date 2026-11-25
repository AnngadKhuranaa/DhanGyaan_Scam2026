import Trade from '../models/Trade.js';
import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';
import { getQuote } from '../services/stockFetcher.js';

export const buyStock = async (req, res, next) => {
  try {
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity || quantity < 1)
      return res.status(400).json({ success: false, message: 'symbol and quantity (≥1) required' });

    const quote = await getQuote(symbol.toUpperCase());
    const price = quote.price;
    const total = price * quantity;

    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });
    if (portfolio.cashBalance < total)
      return res.status(400).json({ success: false, message: 'Insufficient cash balance' });

    // Deduct cash
    portfolio.cashBalance -= total;
    portfolio.totalInvested += total;

    // Update holdings
    const holdingIdx = portfolio.holdings.findIndex((h) => h.symbol === symbol.toUpperCase());
    if (holdingIdx >= 0) {
      const h = portfolio.holdings[holdingIdx];
      const totalQty = h.quantity + quantity;
      h.avgBuyPrice = ((h.avgBuyPrice * h.quantity) + (price * quantity)) / totalQty;
      h.quantity = totalQty;
      h.currentPrice = price;
    } else {
      portfolio.holdings.push({ symbol: symbol.toUpperCase(), companyName: quote.companyName, quantity, avgBuyPrice: price, currentPrice: price });
    }

    await portfolio.save();

    const trade = await Trade.create({
      user: req.user._id, symbol: symbol.toUpperCase(), companyName: quote.companyName,
      type: 'BUY', quantity, price, total
    });

    res.status(201).json({ success: true, message: `Bought ${quantity} shares of ${symbol}`, trade, cashBalance: portfolio.cashBalance });
  } catch (err) { next(err); }
};

export const sellStock = async (req, res, next) => {
  try {
    const { symbol, quantity } = req.body;
    if (!symbol || !quantity || quantity < 1)
      return res.status(400).json({ success: false, message: 'symbol and quantity (≥1) required' });

    const quote = await getQuote(symbol.toUpperCase());
    const price = quote.price;
    const total = price * quantity;

    const portfolio = await Portfolio.findOne({ user: req.user._id });
    const holdingIdx = portfolio?.holdings.findIndex((h) => h.symbol === symbol.toUpperCase());

    if (holdingIdx === undefined || holdingIdx < 0)
      return res.status(400).json({ success: false, message: `No holding found for ${symbol}` });

    const holding = portfolio.holdings[holdingIdx];
    if (holding.quantity < quantity)
      return res.status(400).json({ success: false, message: 'Cannot sell more than you own' });

    // Update holding
    holding.quantity -= quantity;
    holding.currentPrice = price;
    if (holding.quantity === 0) portfolio.holdings.splice(holdingIdx, 1);

    portfolio.cashBalance += total;
    portfolio.totalInvested = Math.max(0, portfolio.totalInvested - holding.avgBuyPrice * quantity);
    await portfolio.save();

    const trade = await Trade.create({
      user: req.user._id, symbol: symbol.toUpperCase(), companyName: quote.companyName,
      type: 'SELL', quantity, price, total
    });

    res.json({ success: true, message: `Sold ${quantity} shares of ${symbol}`, trade, cashBalance: portfolio.cashBalance });
  } catch (err) { next(err); }
};

export const getTradeHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const trades = await Trade.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit);
    const total = await Trade.countDocuments({ user: req.user._id });
    res.json({ success: true, data: trades, pagination: { page: +page, limit: +limit, total } });
  } catch (err) { next(err); }
};
