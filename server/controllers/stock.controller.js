import { getQuote, getHistoricalData, searchStocks } from '../services/stockFetcher.js';
import { runMonteCarlo, calcVaR } from '../services/riskEngine.js';

export const getQuoteHandler = async (req, res, next) => {
  try {
    const data = await getQuote(req.params.symbol.toUpperCase());
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getHistoryHandler = async (req, res, next) => {
  try {
    const { period = '3mo' } = req.query;
    const data = await getHistoricalData(req.params.symbol.toUpperCase(), period);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const searchHandler = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Query param q required' });
    const results = await searchStocks(q);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};

export const simulateHandler = async (req, res, next) => {
  try {
    const {
      symbol,
      currentPrice,
      mu = 0.1,
      sigma = 0.25,
      days = 252,
      simulations = 1000,
    } = req.query;

    if (!currentPrice) return res.status(400).json({ success: false, message: 'currentPrice required' });

    const result = runMonteCarlo(
      +currentPrice, +mu, +sigma, +days, Math.min(+simulations, 5000)
    );
    const var95 = calcVaR(+currentPrice, +sigma, 0.95);
    const var99 = calcVaR(+currentPrice, +sigma, 0.99);

    res.json({ success: true, data: { symbol, ...result, var95, var99 } });
  } catch (err) { next(err); }
};
