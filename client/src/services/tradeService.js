import api from './api';

export const buyStock      = async (symbol, quantity) => (await api.post('/trades/buy',  { symbol, quantity })).data;
export const sellStock     = async (symbol, quantity) => (await api.post('/trades/sell', { symbol, quantity })).data;
export const getTradeHistory = async (page = 1)      => (await api.get('/trades/history', { params: { page } })).data;
