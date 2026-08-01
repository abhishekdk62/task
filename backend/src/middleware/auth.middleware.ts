import { NextFunction, Response } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from '../types';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { verifyAccessToken } from '../utils/jwt';
import { redis, cacheKeys, CACHE_TTL } from '../config/redis';

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = header.slice(7);
    const payload = verifyAccessToken(token);

    const session = await redis.get(cacheKeys.userSession(payload.userId));
    if (!session) {
      throw new UnauthorizedError('Session expired. Please login again.');
    }

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    // Sliding session TTL
    await redis.expire(cacheKeys.userSession(payload.userId), CACHE_TTL.SESSION);
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) return next(error);
    return next(new UnauthorizedError('Invalid or expired access token'));
  }
};

export const authorize =
  (...roles: Role[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
