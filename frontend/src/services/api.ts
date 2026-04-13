import axios from 'axios';

/**
 * Instância Axios pré-configurada para a API do TrackGo.
 * Interceptors adicionam automaticamente o token JWT e tratam erros 401.
 */
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor de request: injeta token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trackgo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de response: redireciona para login em caso de 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('trackgo_token');
      localStorage.removeItem('trackgo_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
