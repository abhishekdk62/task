import Redis from 'ioredis';
import { config } from './index';
import { logger } from './logger';

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', { err: err.message }));

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  SESSION: 7 * 24 * 3600,
} as const;

export const cacheKeys = {
  userSession: (userId: string) => `session:${userId}`,
  dashboardStats: (userId: string) => `dashboard:stats:${userId}`,
  taskList: (userId: string, hash: string) => `tasks:list:${userId}:${hash}`,
  queueStats: () => 'queue:stats',
};
