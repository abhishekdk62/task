import { api } from '@/lib/api';
import type { ApiResponse, User } from '@/types';

export type AdminUser = User & {
  isActive: boolean;
  updatedAt: string;
};

export const adminApi = {
  listUsers: async () => {
    const { data } = await api.get<ApiResponse<AdminUser[]>>('/admin/users');
    return data.data;
  },
};
