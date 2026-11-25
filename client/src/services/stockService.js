import api from './api';

export const getQuote      = async (symbol)         => (await api.get(`/stocks/${symbol}`)).data;
export const getHistory    = async (symbol, period) => (await api.get(`/stocks/history/${symbol}`, { params: { period } })).data;
export const searchStocks  = async (q)              => (await api.get('/stocks/search', { params: { q } })).data;
export const simulate      = async (params)         => (await api.get('/stocks/simulate', { params })).data;
