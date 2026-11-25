import Portfolio from '../models/Portfolio.js';
import { explainPortfolio, analyzeStockRisk } from '../services/aiExplainer.js';

export const explainPortfolioHandler = async (req, res, next) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio || !portfolio.holdings.length)
      return res.status(400).json({ success: false, message: 'No holdings to explain' });

    const { provider = 'gemini' } = req.body;
    const explanation = await explainPortfolio(portfolio.holdings, portfolio.totalPnL, provider);

    res.json({ success: true, data: { explanation } });
  } catch (err) { next(err); }
};

export const analyzeRiskHandler = async (req, res, next) => {
  try {
    const { symbol, stats, provider = 'gemini' } = req.body;
    if (!symbol || !stats)
      return res.status(400).json({ success: false, message: 'symbol and stats required' });

    const analysis = await analyzeStockRisk(symbol, stats, provider);
    res.json({ success: true, data: { analysis } });
  } catch (err) { next(err); }
};
