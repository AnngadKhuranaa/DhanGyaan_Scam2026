import express from 'express';
import { getStockData } from '../services/stock.service.js';

const router = express.Router();

// Static stock list for autocomplete search
const STOCK_LIST = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'DIS', name: 'Walt Disney Company' },
  { symbol: 'BA', name: 'Boeing Company' },
  { symbol: 'ORCL', name: 'Oracle Corporation' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.' },
  { symbol: 'SPOT', name: 'Spotify Technology S.A.' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services' },
  { symbol: 'INFY.NS', name: 'Infosys Limited' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited' },
  { symbol: 'WIPRO.NS', name: 'Wipro Limited' },
];

// GET /api/stocks/search?q=...
router.get('/search', (req, res) => {
  console.log('Stock search API hit:', req.query.q);

  const query = String(req.query.q || '').trim().toLowerCase();

  if (!query) {
    return res.json([]);
  }

  const matches = STOCK_LIST.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query)
  ).slice(0, 10);

  return res.json(matches);
});

// GET /api/stocks/:symbol
router.get('/:symbol', async (req, res) => {
  console.log('Stock data API hit:', req.params.symbol);

  try {
    const data = await getStockData(req.params.symbol);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
