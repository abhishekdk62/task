import { Queue, QueueEvents } from 'bullmq';
import { config } from './index';
import { logger } from './logger';

export const TASK_QUEUE_NAME = 'task-processing';

export const redisConnection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

export const taskQueue = new Queue(TASK_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const taskQueueEvents = new QueueEvents(TASK_QUEUE_NAME, {
  connection: redisConnection,
});

taskQueueEvents.on('completed', ({ jobId }) => {
  logger.info(`Job ${jobId} completed`);
});

taskQueueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`Job ${jobId} failed: ${failedReason}`);
});

export interface TaskJobData {
  taskId: string;
  userId: string;
  title: string;
  payload?: Record<string, unknown> | null;
}
