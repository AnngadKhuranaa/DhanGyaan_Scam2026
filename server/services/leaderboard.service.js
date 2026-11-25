import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';
import { cached } from '../utils/cache.js';
import { round } from '../utils/stats.js';
import { priceHoldings, valueHolding } from './portfolio.service.js';

const LEADERBOARD_TTL_SECONDS = 60;

/**
 * Rank every trader by % return on their starting balance, using live prices.
 * All held symbols across all users are priced in ONE batched quote request,
 * and the ranked list is cached for 60s. (At real scale you'd snapshot this
 * on a schedule instead of computing on read.)
 */
async function computeRanking() {
  const [users, portfolios] = await Promise.all([
    User.find({}, 'username balance startingBalance isDemo').lean(),
    Portfolio.find({}, 'userId holdings realizedPnL').lean(),
  ]);
  const portfolioByUser = new Map(portfolios.map((p) => [p.userId.toString(), p]));

  // Price each distinct symbol once.
  const distinct = new Map();
  for (const p of portfolios) for (const h of p.holdings) distinct.set(h.symbol, h);
  const { quotes, fx } = await priceHoldings([...distinct.values()]);

  const rows = users.map((u) => {
    const holdings = portfolioByUser.get(u._id.toString())?.holdings || [];
    const holdingsValue = holdings.reduce(
      (sum, h) => sum + valueHolding(h, quotes.get(h.symbol), fx.get(h.currency)).marketValueInr,
      0
    );
    const totalValue = u.balance + holdingsValue;
    return {
      userId: u._id.toString(),
      username: u.username,
      isDemo: Boolean(u.isDemo),
      holdingsCount: holdings.length,
      totalValue: round(totalValue),
      totalPnL: round(totalValue - u.startingBalance),
      totalReturnPercent: u.startingBalance > 0 ? round(((totalValue - u.startingBalance) / u.startingBalance) * 100) : 0,
    };
  });

  rows.sort((a, b) => b.totalReturnPercent - a.totalReturnPercent || b.totalValue - a.totalValue);
  return rows.map((row, i) => ({ rank: i + 1, ...row }));
}

export async function getLeaderboard({ page = 1, limit = 20, currentUserId } = {}) {
  const ranking = await cached('leaderboard', LEADERBOARD_TTL_SECONDS, computeRanking);
  const me = currentUserId ? ranking.find((r) => r.userId === currentUserId.toString()) : null;

  // userId is used only to flag "you"; it is not exposed to other users.
  const strip = ({ userId, ...row }) => ({ ...row, isMe: Boolean(me && userId === me.userId) });

  return {
    items: ranking.slice((page - 1) * limit, page * limit).map(strip),
    page,
    limit,
    total: ranking.length,
    totalPages: Math.max(1, Math.ceil(ranking.length / limit)),
    me: me ? strip(me) : null,
    asOf: new Date().toISOString(),
  };
}
