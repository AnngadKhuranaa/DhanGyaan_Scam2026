import Portfolio from '../models/Portfolio.js';
import { getQuote } from '../services/stockFetcher.js';

export const getPortfolio = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });

    // Refresh current prices
    const updatedHoldings = await Promise.all(
      portfolio.holdings.map(async (h) => {
        try {
          const q = await getQuote(h.symbol);
          h.currentPrice = q.price;
          return { ...h.toObject(), currentPrice: q.price };
        } catch {
          return h.toObject();
        }
      })
    );

    const totalCurrentValue = updatedHoldings.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);
    const totalPnL = totalCurrentValue - portfolio.totalInvested;
    const totalPnLPercent = portfolio.totalInvested ? (totalPnL / portfolio.totalInvested) * 100 : 0;

    portfolio.totalCurrentValue = totalCurrentValue;
    portfolio.totalPnL = totalPnL;
    portfolio.totalPnLPercent = totalPnLPercent;
    await portfolio.save();

    res.json({
      success: true,
      data: {
        holdings: updatedHoldings,
        cashBalance: portfolio.cashBalance,
        totalInvested: portfolio.totalInvested,
        totalCurrentValue,
        totalPnL: +totalPnL.toFixed(2),
        totalPnLPercent: +totalPnLPercent.toFixed(2),
      },
    });
  } catch (err) { next(err); }
};

export const getPortfolioStats = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) return res.status(404).json({ success: false, message: 'Portfolio not found' });
    res.json({
      success: true,
      data: {
        cashBalance: portfolio.cashBalance,
        totalInvested: portfolio.totalInvested,
        totalCurrentValue: portfolio.totalCurrentValue,
        totalPnL: portfolio.totalPnL,
        totalPnLPercent: portfolio.totalPnLPercent,
        holdingsCount: portfolio.holdings.length,
      },
    });
  } catch (err) { next(err); }
};
