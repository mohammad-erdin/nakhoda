import type { User } from './entities';

export interface ApiRequest<T> {
  data: T;
  timestamp: number;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  timestamp: number;
}

export interface LoginRequest {
  token: string;
}

export interface LoginResponse {
  sessionToken: string;
  user: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
