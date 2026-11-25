import api from './api';

export const getSentiment    = async (symbol) => (await api.get(`/sentiment/${symbol}`)).data;
export const getNewsSentiment = async (symbol) => (await api.get(`/sentiment/news/${symbol}`)).data;
