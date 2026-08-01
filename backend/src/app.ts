import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import { config } from './config';
import { logger } from './config/logger';
import routes from './routes';
import { apiRateLimiter } from './middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    morgan(config.isProd ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );

  app.use('/uploads', express.static(path.resolve(process.cwd(), config.upload.dir)));
  app.use(apiRateLimiter);
  app.use(config.apiPrefix, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
