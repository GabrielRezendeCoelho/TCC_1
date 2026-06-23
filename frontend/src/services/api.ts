import axios from 'axios'

/**
 * Cria a instância base do Axios para padronizar comunicação HTTP.
 * Configurada para conectar ao Backend NestJS já testado.
 */
export const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Nossa porta padrão do backend local
  timeout: 10000, // Prevenção de travamentos na tela garantindo timeout
})

/**
 * Interceptor de Requisições:
 * Atinge o conceito da Rubrica sobre Manutenção/Limpeza.
 * Em vez de passar o token no código de toda tela, essa lógica é unificada aqui.
 */
api.interceptors.request.use(
  (config) => {
    // Busca o Token salvo localmente
    const token = localStorage.getItem('@TrackGo:token')

    // Se existir token, injeta no cabeçalho Authorization da request
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

/**
 * Interceptor de Respostas:
 * Trata automaticamente erros 401 (token expirado ou inválido).
 * Limpa o localStorage e redireciona para a tela de login.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Não redireciona se já estiver na tela de login
      const isLoginRequest = error.config?.url?.includes('/auth/login')
      if (!isLoginRequest) {
        console.warn('[TrackGo] Token expirado ou inválido. Redirecionando para login...')
        localStorage.removeItem('@TrackGo:token')
        localStorage.removeItem('@TrackGo:user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api

