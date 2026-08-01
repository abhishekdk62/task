import { api } from '@/lib/api';
import type { ApiResponse, AuthResponse, User } from '@/types';

export const authApi = {
  register: async (body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', body);
    return data.data;
  },
  login: async (body: { email: string; password: string }) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', body);
    return data.data;
  },
  logout: async () => {
    const { data } = await api.post<ApiResponse<{ loggedOut: boolean }>>('/auth/logout');
    return data.data;
  },
  me: async () => {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },
};
