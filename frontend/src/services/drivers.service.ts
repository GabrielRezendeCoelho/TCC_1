import api from './api';
import type { Driver } from '../types';

/**
 * Serviço de motoristas — chamadas HTTP isoladas.
 */
export const driversService = {
  async findAll(page = 1, limit = 20, search = '') {
    const params = { page, limit, ...(search && { search }) };
    const { data } = await api.get('/drivers', { params });
    return data.data;
  },

  async findOne(id: string) {
    const { data } = await api.get(`/drivers/${id}`);
    return data.data;
  },

  async create(driver: Partial<Driver>) {
    const { data } = await api.post('/drivers', driver);
    return data.data;
  },

  async update(id: string, driver: Partial<Driver>) {
    const { data } = await api.patch(`/drivers/${id}`, driver);
    return data.data;
  },

  async findRoutes(id: string) {
    const { data } = await api.get(`/drivers/${id}/routes`);
    return data.data;
  },

  async remove(id: string) {
    const { data } = await api.delete(`/drivers/${id}`);
    return data.data;
  },
};
