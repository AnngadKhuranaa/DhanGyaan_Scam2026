import * as tradeService from '../services/trade.service.js';
import * as portfolioService from '../services/portfolio.service.js';
import { sendSuccess } from '../utils/http.js';

export async function placeTrade(req, res) {
  const { symbol, side, quantity } = req.body;
  const result = await tradeService.executeTrade({ userId: req.user._id, symbol, side, quantity });
  const { trade } = result;
  const verb = side === 'BUY' ? 'Bought' : 'Sold';
  sendSuccess(res, result, `${verb} ${trade.quantity} ${trade.symbol} @ ${trade.price.toFixed(2)} ${trade.currency}`, 201);
}

export async function listTrades(req, res) {
  sendSuccess(res, await tradeService.listTrades(req.user._id, req.query));
}

export async function getPortfolio(req, res) {
  sendSuccess(res, await portfolioService.getPortfolioSummary(req.user._id));
}
