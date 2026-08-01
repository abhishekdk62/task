import http from 'http';
import { createApp } from './app';
import { config } from './config';
import { logger } from './config/logger';
import { redis } from './config/redis';
import { prisma } from './config/database';
import { initSocket, emitTaskUpdate } from './socket';
import { createTaskWorker } from './workers/task.worker';
import { subscribeTaskEvents } from './utils/events';

const start = async () => {
  try {
    await redis.connect().catch(() => undefined);

    const app = createApp();
    const server = http.createServer(app);

    initSocket(server);

    // Bridge worker processes -> Socket.IO via Redis pub/sub
    subscribeTaskEvents(({ userId, task }) => {
      emitTaskUpdate(userId, task);
    });

    // Run worker in API process for simpler local/dev; Docker disables this and runs a dedicated worker
    if (!config.isTest && config.runInlineWorker) {
      createTaskWorker();
      logger.info('Inline task worker attached to API process');
    }

    server.listen(config.port, () => {
      logger.info(`TaskFlow API listening on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`API prefix: ${config.apiPrefix}`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down...`);
      server.close(async () => {
        await prisma.$disconnect();
        redis.disconnect();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

start();
