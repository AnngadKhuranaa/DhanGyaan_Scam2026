import * as advisor from '../services/advisor.service.js';
import { sendSuccess } from '../utils/http.js';

export async function chat(req, res) {
  const { message, symbol, history } = req.body;
  sendSuccess(res, await advisor.chat({ userId: req.user._id, message, symbol, history }));
}

export async function explainPortfolio(req, res) {
  sendSuccess(res, await advisor.explainPortfolio(req.user._id));
}
