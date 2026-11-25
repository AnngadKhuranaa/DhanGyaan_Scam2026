import api, { unwrap } from '../lib/api';

/** Thin, typed-by-convention wrappers around every API endpoint. */

export const authService = {
  login: (identifier, password) => unwrap(api.post('/auth/login', { identifier, password })),
  register: (payload) => unwrap(api.post('/auth/register', payload)),
  demo: () => unwrap(api.post('/auth/demo')),
  logout: () => unwrap(api.post('/auth/logout')),
  me: () => unwrap(api.get('/auth/me')),
};

export const marketService = {
  quote: (symbol) => unwrap(api.get(`/market/quote/${encodeURIComponent(symbol)}`)),
  quotes: (symbols) => unwrap(api.get('/market/quotes', { params: { symbols: symbols.join(',') } })),
  history: (symbol, range = '6mo') => unwrap(api.get(`/market/history/${encodeURIComponent(symbol)}`, { params: { range } })),
  search: (q, market) => unwrap(api.get('/market/search', { params: { q, market } })),
  movers: (market) => unwrap(api.get('/market/movers', { params: { market } })),
  indices: (market) => unwrap(api.get('/market/indices', { params: { market } })),
};

export const tradeService = {
  place: (symbol, side, quantity) => unwrap(api.post('/trades', { symbol, side, quantity })),
  history: (params) => unwrap(api.get('/trades', { params })),
  portfolio: () => unwrap(api.get('/portfolio')),
};

export const insightsService = {
  sentiment: (symbol) => unwrap(api.get(`/insights/sentiment/${encodeURIComponent(symbol)}`)),
  confidence: (symbol) => unwrap(api.get(`/insights/confidence/${encodeURIComponent(symbol)}`)),
  exitPlan: (symbol, entry) => unwrap(api.get(`/insights/exit/${encodeURIComponent(symbol)}`, { params: { entry } })),
  simulate: (payload) => unwrap(api.post('/risk/simulate', payload)),
};

export const aiService = {
  chat: (message, symbol, history) => unwrap(api.post('/ai/chat', { message, symbol, history })),
  explainPortfolio: () => unwrap(api.post('/ai/explain-portfolio')),
};

export const communityService = {
  leaderboard: (page = 1, limit = 20) => unwrap(api.get('/leaderboard', { params: { page, limit } })),
  watchlist: () => unwrap(api.get('/watchlist')),
  addToWatchlist: (symbol) => unwrap(api.post('/watchlist', { symbol })),
  removeFromWatchlist: (symbol) => unwrap(api.delete(`/watchlist/${encodeURIComponent(symbol)}`)),
};
