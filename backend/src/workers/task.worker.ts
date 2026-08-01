import { Worker, Job } from 'bullmq';
import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { redisConnection, TASK_QUEUE_NAME, TaskJobData } from '../config/queue';
import { redis, cacheKeys } from '../config/redis';
import { logger } from '../config/logger';
import { publishTaskEvent } from '../utils/events';

const simulateWork = async (payload?: Record<string, unknown> | null) => {
  const duration = 1500 + Math.floor(Math.random() * 2500);
  await new Promise((resolve) => setTimeout(resolve, duration));

  // ~15% simulated failure for demo realism
  if (Math.random() < 0.15) {
    throw new Error('Simulated processing failure');
  }

  return {
    processedAt: new Date().toISOString(),
    durationMs: duration,
    input: payload ?? {},
    output: { ok: true, message: 'Task processed successfully' },
  };
};

const invalidateUserCaches = async (userId: string) => {
  const keys = await redis.keys(`tasks:list:${userId}:*`);
  const toDelete = [...keys, cacheKeys.dashboardStats(userId), cacheKeys.queueStats()];
  if (toDelete.length) await redis.del(...toDelete);
};

export const processTaskJob = async (job: Job<TaskJobData>) => {
  const { taskId, userId, payload } = job.data;
  logger.info(`Processing task ${taskId}`, { jobId: job.id });

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      status: TaskStatus.PROCESSING,
      startedAt: new Date(),
      error: null,
    },
  });

  await publishTaskEvent(userId, task);

  try {
    const result = await simulateWork(payload);

    const completed = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        result: result as Prisma.InputJsonValue,
        completedAt: new Date(),
        error: null,
      },
    });

    await invalidateUserCaches(userId);
    await publishTaskEvent(userId, completed);

    return completed;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    const failed = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.FAILED,
        error: message,
        completedAt: new Date(),
      },
    });

    await invalidateUserCaches(userId);
    await publishTaskEvent(userId, failed);

    throw error;
  }
};

export const createTaskWorker = () => {
  const worker = new Worker<TaskJobData>(TASK_QUEUE_NAME, processTaskJob, {
    connection: redisConnection,
    concurrency: 5,
  });

  worker.on('completed', (job) => {
    logger.info(`Worker completed job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Worker failed job ${job?.id}: ${err.message}`);
  });

  return worker;
};

// Allow running as standalone process
if (require.main === module) {
  const worker = createTaskWorker();
  logger.info('Task worker started');

  const shutdown = async () => {
    logger.info('Shutting down worker...');
    await worker.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
