import api from './api';
import type { DeliveryRoute } from '../types';

/**
 * Serviço de rotas — chamadas HTTP isoladas.
 */
export const routesService = {
  async findAll(page = 1, limit = 20, search = '') {
    const params = { page, limit, ...(search && { search }) };
    const { data } = await api.get('/routes', { params });
    return data.data;
  },

  async findOne(id: string) {
    const { data } = await api.get(`/routes/${id}`);
    return data.data;
  },

  async create(route: Partial<DeliveryRoute> & { packageIds?: string[] }) {
    const { data } = await api.post('/routes', route);
    return data.data;
  },

  async generateSmart(payload: { name: string; date: string; packageIds: string[] }) {
    const { data } = await api.post('/routes/generate-smart', payload);
    return data.data;
  },

  async update(id: string, route: Partial<DeliveryRoute>) {
    const { data } = await api.patch(`/routes/${id}`, route);
    return data.data;
  },

  async optimize(id: string) {
    const { data } = await api.post(`/routes/${id}/optimize`);
    return data.data;
  },

  async assignDriver(routeId: string, driverId: string) {
    const { data } = await api.post(`/routes/${routeId}/assign-driver`, { driverId });
    return data.data;
  },

  async remove(id: string) {
    const { data } = await api.delete(`/routes/${id}`);
    return data.data;
  },
};
