import express from 'express';
import { getTopMarketData } from '../services/market.service.js';

const router = express.Router();

router.get('/top', async (req, res) => {
  console.log('Market API hit');

  try {
    const data = await getTopMarketData();

    return res.json({
      topGainers: data.topGainers || [],
      topLosers: data.topLosers || [],
      mostTraded: data.mostTraded || [],
      gainers: data.topGainers || [],
      losers: data.topLosers || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      topGainers: [],
      topLosers: [],
      mostTraded: [],
      gainers: [],
      losers: [],
    });
  }
});

router.get('/pulse', async (req, res) => {
  return res.json({
    pulse: [
      { symbol: 'NIFTY 50', changePercent: Number((Math.random() * 1.5 - 0.5).toFixed(2)) },
      { symbol: 'BANKNIFTY', changePercent: Number((Math.random() * 2.0 - 0.7).toFixed(2)) }
    ]
  });
});

export default router;
