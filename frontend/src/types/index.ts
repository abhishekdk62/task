export type Role = 'USER' | 'ADMIN';
export type TaskStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  payload?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  error?: string | null;
  retries: number;
  maxRetries: number;
  scheduledAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  tasks: {
    total: number;
    completed: number;
    failed: number;
    pending: number;
    processing: number;
  };
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { pagination?: PaginatedMeta };
  errors?: unknown;
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
