/**
 * Interfaces TypeScript compartilhadas do TrackGo Frontend.
 * Espelham os modelos do backend Prisma.
 */

export type Role = 'ADMIN' | 'OPERATOR' | 'DRIVER';
export type PackageStatus = 'PENDING' | 'IN_ROUTE' | 'DELIVERED' | 'RETURNED';
export type RouteStatus = 'DRAFT' | 'OPTIMIZED' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Driver {
  id: string;
  licenseNumber: string;
  phone: string;
  userId: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
  createdAt: string;
}

export interface Package {
  id: string;
  trackingCode: string;
  recipientName: string;
  recipientPhone?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  weight?: number;
  status: PackageStatus;
  routeId?: string;
  route?: Pick<DeliveryRoute, 'id' | 'name' | 'status'>;
  createdAt: string;
}

export interface DeliveryRoute {
  id: string;
  name: string;
  date: string;
  status: RouteStatus;
  startAddress?: string;
  optimizedOrder?: string[];
  totalDistance?: number;
  estimatedTime?: number;
  driverId?: string;
  driver?: Driver;
  createdById: string;
  createdBy?: Pick<User, 'name' | 'email'>;
  packages?: Package[];
  _count?: { packages: number };
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: Pick<User, 'id' | 'email' | 'role'>;
}

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: {
    [key: string]: T[];
    meta: any;
  };
  statusCode: number;
  timestamp: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
