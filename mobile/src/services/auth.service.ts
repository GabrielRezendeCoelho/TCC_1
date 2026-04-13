import api from './api';
import type { AuthResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', { email, password });
    return data.data; // Resposta padronizada do nosso interceptor de sucesso NestJS
  },

  async getProfile() {
    const { data } = await api.get('/auth/profile');
    return data.data;
  },
};
