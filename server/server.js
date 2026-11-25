import cors from 'cors';
import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import marketRoutes from './routes/market.routes.js';
import sentimentRoutes from './routes/sentiment.routes.js';
import simulateRoutes from './routes/simulate.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import stockRoutes from './routes/stock.routes.js';
import tradeRoutes from './routes/trade.routes.js';
import riskRoutes from './routes/risk.routes.js';
import aiRoutes from './routes/ai.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API working' });
});

app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/sentiment', sentimentRoutes);
app.use('/api', simulateRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/ai', aiRoutes);

// Catch-all: return JSON 404 (never send HTML)
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
}

startServer();
