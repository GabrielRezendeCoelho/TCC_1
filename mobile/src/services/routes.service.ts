import api from './api';

export const routesService = {
  async getMyRoutes() {
    // Para simplificar, motoristas puxam rotas atreladas a si
    // O backend precisa ter o filtro ou podemos buscar filtrando via driver
    const { data } = await api.get('/routes');
    return data.data;
  },

  async getRouteDetail(id: string) {
    const { data } = await api.get(`/routes/${id}`);
    return data.data;
  },
  
  async updatePackageStatus(packageId: string, status: string) {
    const { data } = await api.patch(`/packages/${packageId}`, { status });
    return data.data;
  }
};
