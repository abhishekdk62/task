import { api } from '@/lib/api';
import type { ApiResponse, DashboardStats, PaginatedMeta, Task, TaskFilters } from '@/types';

export const taskApi = {
  list: async (filters: TaskFilters) => {
    const { data } = await api.get<ApiResponse<Task[]>>('/tasks', { params: filters });
    return {
      items: data.data,
      pagination: data.meta?.pagination as PaginatedMeta,
    };
  },
  getById: async (id: string) => {
    const { data } = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return data.data;
  },
  create: async (formData: FormData) => {
    const { data } = await api.post<ApiResponse<Task>>('/tasks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
  update: async (id: string, body: Partial<Task>) => {
    const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, body);
    return data.data;
  },
  remove: async (id: string) => {
    const { data } = await api.delete<ApiResponse<{ deleted: boolean }>>(`/tasks/${id}`);
    return data.data;
  },
  retry: async (id: string) => {
    const { data } = await api.post<ApiResponse<Task>>(`/tasks/${id}/retry`);
    return data.data;
  },
  schedule: async (id: string, scheduledAt: string) => {
    const { data } = await api.post<ApiResponse<Task>>(`/tasks/${id}/schedule`, {
      scheduledAt,
    });
    return data.data;
  },
};

export const dashboardApi = {
  stats: async () => {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return data.data;
  },
};
