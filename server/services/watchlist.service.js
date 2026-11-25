import Watchlist, { WATCHLIST_LIMIT } from '../models/Watchlist.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { getQuote, getQuotes } from './marketData.service.js';

/** The user's watchlist with live quotes (quote is null if pricing failed). */
export async function getWatchlist(userId) {
  const list = await Watchlist.findOne({ userId }).lean();
  const items = list?.items || [];
  if (items.length === 0) return { items: [], pricesStale: false };

  let quotes = new Map();
  let pricesStale = false;
  try {
    quotes = await getQuotes(items.map((i) => i.symbol));
  } catch (error) {
    logger.warn(`Watchlist pricing failed: ${error.message}`);
    pricesStale = true;
  }
  return {
    items: items.map((i) => ({ ...i, quote: quotes.get(i.symbol) || null })),
    pricesStale,
  };
}

export async function addToWatchlist(userId, symbol) {
  const quote = await getQuote(symbol); // validates the symbol exists (404 otherwise)

  const list = await Watchlist.findOne({ userId });
  if (list?.items.some((i) => i.symbol === quote.symbol)) {
    throw ApiError.conflict(`${quote.symbol} is already on your watchlist`);
  }
  if (list && list.items.length >= WATCHLIST_LIMIT) {
    throw ApiError.badRequest(`Watchlist is limited to ${WATCHLIST_LIMIT} symbols`);
  }

  // $addToSet-style atomic push; upsert creates the watchlist on first add.
  await Watchlist.updateOne(
    { userId, 'items.symbol': { $ne: quote.symbol } },
    { $push: { items: { symbol: quote.symbol, name: quote.shortName } } },
    { upsert: true }
  );
  return getWatchlist(userId);
}

export async function removeFromWatchlist(userId, symbol) {
  // Match on the item itself: timestamps make modifiedCount always 1, so it can't be trusted here.
  const result = await Watchlist.updateOne({ userId, 'items.symbol': symbol }, { $pull: { items: { symbol } } });
  if (result.matchedCount === 0) throw ApiError.notFound(`${symbol} is not on your watchlist`);
  return getWatchlist(userId);
}
