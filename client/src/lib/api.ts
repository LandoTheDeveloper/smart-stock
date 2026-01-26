import axios from 'axios';

export const api = axios.create({
  baseURL: '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth.token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
