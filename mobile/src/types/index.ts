export type Role = 'ADMIN' | 'OPERATOR' | 'DRIVER';
export type PackageStatus = 'PENDING' | 'IN_ROUTE' | 'DELIVERED' | 'RETURNED';
export type RouteStatus = 'DRAFT' | 'OPTIMIZED' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Driver {
  id: string;
  licenseNumber: string;
  phone: string;
  userId: string;
}

export interface Package {
  id: string;
  trackingCode: string;
  recipientName: string;
  address: string;
  latitude?: number;
  longitude?: number;
  status: PackageStatus;
}

export interface DeliveryRoute {
  id: string;
  name: string;
  date: string;
  status: RouteStatus;
  optimizedOrder?: string[];
  totalDistance?: number;
  packages?: Package[];
  _count?: { packages: number };
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
