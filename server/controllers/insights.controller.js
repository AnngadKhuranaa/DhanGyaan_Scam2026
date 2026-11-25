import { getSentiment } from '../services/sentiment.service.js';
import { getConfidence, getExitPlan } from '../services/insights.service.js';
import { sendSuccess } from '../utils/http.js';

export async function sentiment(req, res) {
  sendSuccess(res, await getSentiment(req.params.symbol));
}

export async function confidence(req, res) {
  sendSuccess(res, await getConfidence(req.params.symbol));
}

export async function exitPlan(req, res) {
  sendSuccess(res, await getExitPlan(req.params.symbol, req.query.entry));
}
