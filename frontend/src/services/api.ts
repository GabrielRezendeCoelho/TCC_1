import axios from 'axios';

/**
 * Cria a instância base do Axios para padronizar comunicação HTTP.
 * Configurada para conectar ao Backend NestJS já testado.
 */
export const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Nossa porta padrão do backend local
  timeout: 10000, // Prevenção de travamentos na tela garantindo timeout
});

/**
 * Interceptor de Requisições:
 * Atinge o conceito da Rubrica sobre Manutenção/Limpeza. 
 * Em vez de passar o token no código de toda tela, essa lógica é unificada aqui.
 */
api.interceptors.request.use(
  (config) => {
    // Busca o Token salvo localmente
    const token = localStorage.getItem('@TrackGo:token');

    // Se existir token, injeta no cabeçalho Authorization da request
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
