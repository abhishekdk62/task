import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { taskQueue } from '../config/queue';
import { logger } from '../config/logger';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'test') {
    return res.status(200).json({
      success: true,
      message: 'TaskFlow API is healthy',
      data: {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        checks: { api: 'ok', database: 'skipped', redis: 'skipped', queue: 'skipped' },
      },
    });
  }

  const checks: Record<string, string> = {
    api: 'ok',
    database: 'unknown',
    redis: 'unknown',
    queue: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
    logger.error('Health check DB failed', { error });
  }

  try {
    const pong = await redis.ping();
    checks.redis = pong === 'PONG' ? 'ok' : 'error';
  } catch (error) {
    checks.redis = 'error';
    logger.error('Health check Redis failed', { error });
  }

  try {
    const waiting = await taskQueue.getWaitingCount();
    checks.queue = 'ok';
    checks.queueWaiting = String(waiting);
  } catch (error) {
    checks.queue = 'error';
    logger.error('Health check queue failed', { error });
  }

  const healthy = checks.database === 'ok' && checks.redis === 'ok' && checks.queue === 'ok';

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'TaskFlow API is healthy' : 'TaskFlow API is degraded',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks,
    },
  });
});

export default router;
