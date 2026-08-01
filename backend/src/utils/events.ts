import { redis } from '../config/redis';
import { logger } from '../config/logger';

export const TASK_EVENTS_CHANNEL = 'taskflow:task-events';

export interface TaskEventMessage {
  userId: string;
  task: unknown;
}

export const publishTaskEvent = async (userId: string, task: unknown) => {
  const message: TaskEventMessage = { userId, task };
  await redis.publish(TASK_EVENTS_CHANNEL, JSON.stringify(message));
};

export const subscribeTaskEvents = (
  onMessage: (payload: TaskEventMessage) => void
) => {
  const subscriber = redis.duplicate();

  (async () => {
    try {
      if (subscriber.status !== 'ready') {
        await subscriber.connect();
      }
      await subscriber.subscribe(TASK_EVENTS_CHANNEL);
      logger.info(`Subscribed to ${TASK_EVENTS_CHANNEL}`);
    } catch (err) {
      logger.error('Failed to subscribe to task events', {
        err: err instanceof Error ? err.message : err,
      });
    }
  })();

  subscriber.on('message', (_channel, raw) => {
    try {
      const payload = JSON.parse(raw) as TaskEventMessage;
      onMessage(payload);
    } catch (error) {
      logger.error('Invalid task event payload', { error });
    }
  });

  return subscriber;
};
