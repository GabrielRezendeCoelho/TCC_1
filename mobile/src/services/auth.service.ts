import api from './api';
import type { AuthResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post('/auth/login', { email, password });
    return data.data; // Resposta padronizada do nosso interceptor de sucesso NestJS
  },

  async register(payload: any) {
    const { data } = await api.post('/auth/register', payload);
    return data.data;
  },

  async getProfile() {
    const { data } = await api.get('/auth/profile');
    return data.data;
  },

  async updateProfile(payload: { name?: string; baseAddress?: string; baseLat?: number; baseLng?: number }) {
    const { data } = await api.patch('/auth/profile', payload);
    return data.data;
  },
};
