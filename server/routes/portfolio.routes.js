import express from 'express';
import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';
import { getStockData } from '../services/stock.service.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const [user, portfolio] = await Promise.all([
      User.findById(userId),
      Portfolio.findOne({ userId }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!portfolio) {
      return res.json({
        success: true,
        balance: Number(user.balance.toFixed(2)),
        holdings: [],
        totalValue: Number(user.balance.toFixed(2)),
        investedValue: 0,
        unrealizedPnL: 0,
        realizedPnL: 0,
        totalPnL: 0,
      });
    }

    const holdings = await Promise.all(
      portfolio.stocks.map(async (holding) => {
        const marketData = await getStockData(holding.name);
        const currentPrice = Number(marketData.price);
        const marketValue = currentPrice * holding.quantity;
        const investedValue = holding.avgPrice * holding.quantity;
        const pnl = marketValue - investedValue;

        return {
          ...holding.toObject(),
          currentPrice: Number(currentPrice.toFixed(2)),
          marketValue: Number(marketValue.toFixed(2)),
          pnl: Number(pnl.toFixed(2)),
        };
      })
    );

    const investedValue = holdings.reduce((sum, item) => sum + item.avgPrice * item.quantity, 0);
    const holdingsValue = holdings.reduce((sum, item) => sum + item.marketValue, 0);
    const unrealizedPnL = holdings.reduce((sum, item) => sum + item.pnl, 0);
    const totalValue = user.balance + holdingsValue;
    const totalPnL = portfolio.realizedPnL + unrealizedPnL;

    return res.json({
      success: true,
      balance: Number(user.balance.toFixed(2)),
      holdings,
      totalValue: Number(totalValue.toFixed(2)),
      investedValue: Number(investedValue.toFixed(2)),
      unrealizedPnL: Number(unrealizedPnL.toFixed(2)),
      realizedPnL: Number(portfolio.realizedPnL.toFixed(2)),
      totalPnL: Number(totalPnL.toFixed(2)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
