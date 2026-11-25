import { Router } from 'express';
import authRoutes from './auth.routes.js';
import marketRoutes from './market.routes.js';
import sentimentRoutes from './sentiment.routes.js';
import simulateRoutes from './simulate.routes.js';
import portfolioRoutes from './portfolio.routes.js';
import leaderboardRoutes from './leaderboard.routes.js';
import stockRoutes from './stock.routes.js';
import tradeRoutes from './trade.routes.js';
import riskRoutes from './risk.routes.js';
import aiRoutes from './ai.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/market', marketRoutes);
router.use('/sentiment', sentimentRoutes);
router.use('/', simulateRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/stocks', stockRoutes);
router.use('/trades', tradeRoutes);
router.use('/risk', riskRoutes);
router.use('/ai', aiRoutes);

export default router;
