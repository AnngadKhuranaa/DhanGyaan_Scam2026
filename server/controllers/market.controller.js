import * as market from '../services/marketData.service.js';
import { sendSuccess } from '../utils/http.js';

export async function quote(req, res) {
  sendSuccess(res, await market.getQuote(req.params.symbol));
}

export async function quotes(req, res) {
  const symbols = req.query.symbols.split(',').map((s) => s.trim()).filter(Boolean);
  const map = await market.getQuotes(symbols);
  sendSuccess(res, symbols.map((s) => map.get(s.toUpperCase())).filter(Boolean));
}

export async function history(req, res) {
  const range = req.query.range || '1y';
  const candles = await market.getHistory(req.params.symbol, range);
  sendSuccess(res, { symbol: req.params.symbol, range, candles });
}

export async function search(req, res) {
  sendSuccess(res, await market.searchSymbols(req.query.q, req.query.market));
}

export async function movers(req, res) {
  sendSuccess(res, await market.getMovers(req.query.market || 'IN'));
}

export async function indices(req, res) {
  sendSuccess(res, await market.getIndices(req.query.market || 'IN'));
}
