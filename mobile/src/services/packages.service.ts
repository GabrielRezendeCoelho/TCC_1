import api from './api';

export const packagesService = {
  createPackage: async (data: { trackingCode: string; recipientName: string; address: string }) => {
    const response = await api.post('/packages', data);
    return response.data;
  },
  
  updatePackageStatus: async (packageId: string, status: string) => {
    const response = await api.patch(`/packages/${packageId}/status`, { status });
    return response.data;
  }
};
