import axios from 'axios';

const api = axios.create({
  baseURL: 'https://invento-xidw.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('invento_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;