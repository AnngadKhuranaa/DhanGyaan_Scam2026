import api from './api';

export const login    = async (identifier, password) => (await api.post('/auth/login', { identifier, password })).data;
export const register = async (username, email, phone, password) => (await api.post('/auth/register', { username, email, phone, password })).data;
export const logout   = async () => (await api.post('/auth/logout')).data;
export const getMe    = async () => (await api.get('/auth/me')).data;
