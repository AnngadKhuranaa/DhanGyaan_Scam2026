import { Router } from 'express';
import authRoutes from './auth.routes.js';
import marketRoutes from './market.routes.js';
import insightsRoutes from './insights.routes.js';
import portfolioRoutes from './portfolio.routes.js';
import leaderboardRoutes from './leaderboard.routes.js';
import tradeRoutes from './trade.routes.js';
import riskRoutes from './risk.routes.js';
import aiRoutes from './ai.routes.js';
import watchlistRoutes from './watchlist.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/market', marketRoutes);
router.use('/insights', insightsRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/trades', tradeRoutes);
router.use('/risk', riskRoutes);
router.use('/ai', aiRoutes);
router.use('/watchlist', watchlistRoutes);

export default router;
