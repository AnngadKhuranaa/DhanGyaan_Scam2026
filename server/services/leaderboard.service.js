import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';
import { getStockData } from './stock.service.js';

export async function getLeaderboardData() {
  const portfolios = await Portfolio.find({});

  const leaderboard = await Promise.all(
    portfolios.map(async (portfolio) => {
      const user = await User.findById(portfolio.userId);

      if (!user) {
        return null;
      }

      const holdings = await Promise.all(
        portfolio.stocks.map(async (holding) => {
          const stockData = await getStockData(holding.name);
          const currentPrice = Number(stockData.price ?? 0);
          const marketValue = currentPrice * holding.quantity;
          const investedValue = holding.avgPrice * holding.quantity;

          return {
            marketValue,
            investedValue,
          };
        })
      );

      const investedValue = holdings.reduce((sum, item) => sum + item.investedValue, 0);
      const currentValue = holdings.reduce((sum, item) => sum + item.marketValue, 0);
      const totalPnL = portfolio.realizedPnL + (currentValue - investedValue);
      const totalReturnPercent =
        investedValue > 0 ? (totalPnL / investedValue) * 100 : 0;

      return {
        userId: user._id,
        email: user.email,
        totalReturnPercent: Number(totalReturnPercent.toFixed(2)),
        totalPnL: Number(totalPnL.toFixed(2)),
        portfolioValue: Number((user.balance + currentValue).toFixed(2)),
      };
    })
  );

  return leaderboard
    .filter(Boolean)
    .sort((a, b) => b.totalReturnPercent - a.totalReturnPercent)
    .slice(0, 10);
}
