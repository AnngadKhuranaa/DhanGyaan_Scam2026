import { simulateRisk } from '../services/risk.service.js';
import { sendSuccess } from '../utils/http.js';

export async function simulate(req, res) {
  const { symbol, amount, horizonDays, paths, lookback, seed } = req.body;
  sendSuccess(res, await simulateRisk({ symbol, amount, horizonDays, paths, lookback, seed }));
}
