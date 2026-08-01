import { Prisma, Task, TaskPriority, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { PaginatedResult, PaginationQuery } from '../types';

export interface TaskFilters extends PaginationQuery {
  userId?: string;
}

export class TaskRepository {
  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    return prisma.task.create({ data });
  }

  async findById(id: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    return prisma.task.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Task> {
    return prisma.task.delete({ where: { id } });
  }

  async findMany(filters: TaskFilters): Promise<PaginatedResult<Task>> {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.TaskWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status && Object.values(TaskStatus).includes(filters.status as TaskStatus)) {
      where.status = filters.status as TaskStatus;
    }

    if (
      filters.priority &&
      Object.values(TaskPriority).includes(filters.priority as TaskPriority)
    ) {
      where.priority = filters.priority as TaskPriority;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const allowedSort = ['createdAt', 'updatedAt', 'title', 'status', 'priority', 'scheduledAt'];
    const sortBy = allowedSort.includes(filters.sortBy || '') ? filters.sortBy! : 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getStats(userId?: string) {
    const where: Prisma.TaskWhereInput = userId ? { userId } : {};

    const [total, completed, failed, pending, processing] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: TaskStatus.COMPLETED } }),
      prisma.task.count({ where: { ...where, status: TaskStatus.FAILED } }),
      prisma.task.count({ where: { ...where, status: TaskStatus.PENDING } }),
      prisma.task.count({ where: { ...where, status: TaskStatus.PROCESSING } }),
    ]);

    return { total, completed, failed, pending, processing };
  }
}

export const taskRepository = new TaskRepository();
