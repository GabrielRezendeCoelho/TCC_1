import api from './api';
import type { AuthResponse } from '../types';

/**
 * Serviço de autenticação — chamadas HTTP isoladas.
 */
export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', { email, password });
    // O backend retorna { data: { accessToken, user }, statusCode, timestamp }
    return data.data;
  },

  async register(name: string, email: string, password: string, role?: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    return data.data;
  },

  async getProfile() {
    const { data } = await api.get('/auth/profile');
    return data.data;
  },
};
