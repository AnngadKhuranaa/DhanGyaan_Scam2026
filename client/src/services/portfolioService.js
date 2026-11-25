import api from './api';

export const getPortfolio      = async () => (await api.get('/portfolio')).data;
export const getPortfolioStats = async () => (await api.get('/portfolio/stats')).data;
export const explainPortfolio  = async (provider = 'gemini') => (await api.post('/ai/explain', { provider })).data;
export const analyzeRisk       = async (symbol, stats)       => (await api.post('/ai/analyze-risk', { symbol, stats })).data;
export const getLeaderboard    = async ()                    => (await api.get('/leaderboard')).data;
