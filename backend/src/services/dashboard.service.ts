import { Role } from '@prisma/client';
import { taskRepository } from '../repositories/task.repository';
import { taskQueue } from '../config/queue';
import { redis, cacheKeys, CACHE_TTL } from '../config/redis';
import { AuthUser } from '../types';

export class DashboardService {
  async getStats(user: AuthUser) {
    const cacheKey = cacheKeys.dashboardStats(user.id);
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const userId = user.role === Role.ADMIN ? undefined : user.id;
    const taskStats = await taskRepository.getStats(userId);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      taskQueue.getWaitingCount(),
      taskQueue.getActiveCount(),
      taskQueue.getCompletedCount(),
      taskQueue.getFailedCount(),
      taskQueue.getDelayedCount(),
    ]);

    const result = {
      tasks: taskStats,
      queue: {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + delayed,
      },
    };

    await redis.setex(cacheKey, CACHE_TTL.SHORT, JSON.stringify(result));
    return result;
  }
}

export const dashboardService = new DashboardService();
