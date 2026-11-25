import * as leaderboardService from '../services/leaderboard.service.js';
import * as watchlistService from '../services/watchlist.service.js';
import { sendSuccess } from '../utils/http.js';

export async function leaderboard(req, res) {
  const { page, limit } = req.query;
  sendSuccess(res, await leaderboardService.getLeaderboard({ page, limit, currentUserId: req.user._id }));
}

export async function getWatchlist(req, res) {
  sendSuccess(res, await watchlistService.getWatchlist(req.user._id));
}

export async function addToWatchlist(req, res) {
  const data = await watchlistService.addToWatchlist(req.user._id, req.body.symbol);
  sendSuccess(res, data, `Added ${req.body.symbol} to watchlist`, 201);
}

export async function removeFromWatchlist(req, res) {
  const data = await watchlistService.removeFromWatchlist(req.user._id, req.params.symbol);
  sendSuccess(res, data, `Removed ${req.params.symbol} from watchlist`);
}
