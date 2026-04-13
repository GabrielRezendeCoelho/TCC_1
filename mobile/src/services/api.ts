import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configure sua baseURL de acordo com seu ambiente de desenvolvimento.
 * Usando o IP da máquina na rede local permite ao emulador ou dispositivo físico bater na API.
 */
// TODO: Replace with your actual local IP
const BASE_URL = 'http://192.168.0.x:3000/api'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@TrackGo:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Trata automaticamente respostas com 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('@TrackGo:token');
      await AsyncStorage.removeItem('@TrackGo:user');
      // Redirecionamento é melhor lidado no AuthContext via state reativo
    }
    return Promise.reject(error);
  },
);

export default api;
