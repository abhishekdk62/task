import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { logger } from '../config/logger';
import { config } from '../config';

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Route not found', 404));
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(err.message, { statusCode: err.statusCode, errors: err.errors });
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  logger.error('Unhandled error', { err: err.message, stack: err.stack });
  return sendError(
    res,
    config.isProd ? 'Internal server error' : err.message,
    500
  );
};
