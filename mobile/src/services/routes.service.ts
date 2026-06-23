import api from './api';

export const routesService = {
  async getMyRoutes() {
    const { data } = await api.get('/routes');
    return data.data;
  },

  async getRouteDetail(id: string) {
    const { data } = await api.get(`/routes/${id}`);
    return data.data;
  },

  async createRoute(payload: { name: string; date: string }) {
    const { data } = await api.post('/routes', payload);
    return data.data;
  },
  
  async updatePackageStatus(packageId: string, status: string) {
    const { data } = await api.patch(`/packages/${packageId}`, { status });
    return data.data;
  },

  async optimizeRoute(id: string) {
    const { data } = await api.post(`/routes/${id}/optimize`);
    return data.data;
  },

  async deleteRoute(id: string) {
    const { data } = await api.delete(`/routes/${id}`);
    return data.data;
  },
};
