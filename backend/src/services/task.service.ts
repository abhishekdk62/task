import { Role, TaskPriority, TaskStatus, Prisma } from '@prisma/client';
import { taskRepository, TaskFilters } from '../repositories/task.repository';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { taskQueue, TaskJobData } from '../config/queue';
import { redis, cacheKeys, CACHE_TTL } from '../config/redis';
import { AuthUser } from '../types';
import { logger } from '../config/logger';
import crypto from 'crypto';

export class TaskService {
  async create(
    user: AuthUser,
    input: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      payload?: Record<string, unknown>;
      scheduledAt?: string;
      maxRetries?: number;
      fileUrl?: string;
      fileName?: string;
    }
  ) {
    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (scheduledAt && scheduledAt.getTime() < Date.now()) {
      throw new ValidationError('scheduledAt must be in the future');
    }

    const task = await taskRepository.create({
      title: input.title,
      description: input.description,
      priority: input.priority || TaskPriority.MEDIUM,
      payload: (input.payload as Prisma.InputJsonValue) ?? undefined,
      scheduledAt,
      maxRetries: input.maxRetries ?? 3,
      fileUrl: input.fileUrl,
      fileName: input.fileName,
      status: TaskStatus.PENDING,
      user: { connect: { id: user.id } },
    });

    await this.enqueue(task.id, user.id, task.title, input.payload, scheduledAt);
    await this.invalidateCache(user.id);

    return task;
  }

  async list(user: AuthUser, filters: TaskFilters) {
    const scoped: TaskFilters = {
      ...filters,
      userId: user.role === Role.ADMIN ? filters.userId : user.id,
    };

    if (user.role !== Role.ADMIN) {
      scoped.userId = user.id;
    }

    const cacheHash = crypto
      .createHash('md5')
      .update(JSON.stringify(scoped))
      .digest('hex');
    const cacheKey = cacheKeys.taskList(user.id, cacheHash);

    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await taskRepository.findMany(scoped);
    await redis.setex(cacheKey, CACHE_TTL.SHORT, JSON.stringify(result));
    return result;
  }

  async getById(user: AuthUser, id: string) {
    const task = await taskRepository.findById(id);
    if (!task) throw new NotFoundError('Task not found');
    this.assertOwnership(user, task.userId);
    return task;
  }

  async update(
    user: AuthUser,
    id: string,
    input: {
      title?: string;
      description?: string | null;
      priority?: TaskPriority;
      payload?: Record<string, unknown> | null;
      scheduledAt?: string | null;
      maxRetries?: number;
    }
  ) {
    const existing = await this.getById(user, id);

    if (existing.status === TaskStatus.PROCESSING) {
      throw new ValidationError('Cannot update a task that is currently processing');
    }

    const data: Record<string, unknown> = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.payload !== undefined) data.payload = input.payload as Prisma.InputJsonValue;
    if (input.maxRetries !== undefined) data.maxRetries = input.maxRetries;
    if (input.scheduledAt !== undefined) {
      data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    }

    const updated = await taskRepository.update(id, data);
    await this.invalidateCache(user.id);
    return updated;
  }

  async delete(user: AuthUser, id: string) {
    const existing = await this.getById(user, id);
    if (existing.status === TaskStatus.PROCESSING) {
      throw new ValidationError('Cannot delete a task that is currently processing');
    }
    await taskRepository.delete(id);
    await this.invalidateCache(user.id);
    return { deleted: true };
  }

  async retry(user: AuthUser, id: string) {
    const task = await this.getById(user, id);
    if (task.status !== TaskStatus.FAILED) {
      throw new ValidationError('Only failed tasks can be retried');
    }

    const updated = await taskRepository.update(id, {
      status: TaskStatus.PENDING,
      error: null,
      result: undefined,
      startedAt: null,
      completedAt: null,
      retries: { increment: 1 },
    });

    await this.enqueue(
      updated.id,
      user.id,
      updated.title,
      (updated.payload as Record<string, unknown>) || null
    );
    await this.invalidateCache(user.id);
    return updated;
  }

  async schedule(user: AuthUser, id: string, scheduledAt: string) {
    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      throw new ValidationError('scheduledAt must be a valid future datetime');
    }

    const task = await this.getById(user, id);
    if (task.status === TaskStatus.PROCESSING || task.status === TaskStatus.COMPLETED) {
      throw new ValidationError('Cannot schedule a processing or completed task');
    }

    const updated = await taskRepository.update(id, {
      scheduledAt: date,
      status: TaskStatus.PENDING,
      error: null,
    });

    await this.enqueue(
      updated.id,
      user.id,
      updated.title,
      (updated.payload as Record<string, unknown>) || null,
      date
    );
    await this.invalidateCache(user.id);
    return updated;
  }

  private async enqueue(
    taskId: string,
    userId: string,
    title: string,
    payload?: Record<string, unknown> | null,
    scheduledAt?: Date | null
  ) {
    const jobData: TaskJobData = { taskId, userId, title, payload };

    const options: { jobId: string; delay?: number } = {
      jobId: `task-${taskId}-${Date.now()}`,
    };

    if (scheduledAt) {
      options.delay = Math.max(0, scheduledAt.getTime() - Date.now());
    }

    await taskQueue.add('process-task', jobData, options);
    logger.info(`Enqueued task ${taskId}`, { delay: options.delay || 0 });
  }

  private assertOwnership(user: AuthUser, ownerId: string) {
    if (user.role !== Role.ADMIN && user.id !== ownerId) {
      throw new ForbiddenError('You do not have access to this task');
    }
  }

  private async invalidateCache(userId: string) {
    const keys = await redis.keys(`tasks:list:${userId}:*`);
    const dashboardKey = cacheKeys.dashboardStats(userId);
    const toDelete = [...keys, dashboardKey, cacheKeys.queueStats()];
    if (toDelete.length) {
      await redis.del(...toDelete);
    }
  }
}

export const taskService = new TaskService();
