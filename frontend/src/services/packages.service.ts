import api from './api';
import type { Package } from '../types';

/**
 * Serviço de pacotes — chamadas HTTP isoladas.
 */
export const packagesService = {
  async findAll(page = 1, limit = 20, search = '') {
    const params = { page, limit, ...(search && { search }) };
    const { data } = await api.get('/packages', { params });
    return data.data;
  },

  async findOne(id: string) {
    const { data } = await api.get(`/packages/${id}`);
    return data.data;
  },

  async create(pkg: Partial<Package>) {
    const { data } = await api.post('/packages', pkg);
    return data.data;
  },

  async createBatch(packages: Partial<Package>[]) {
    const { data } = await api.post('/packages/batch', packages);
    return data.data;
  },

  async update(id: string, pkg: Partial<Package>) {
    const { data } = await api.patch(`/packages/${id}`, pkg);
    return data.data;
  },

  async remove(id: string) {
    const { data } = await api.delete(`/packages/${id}`);
    return data.data;
  },
};
