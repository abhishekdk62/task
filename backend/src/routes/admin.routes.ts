import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { userRepository } from '../repositories/user.repository';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

const router = Router();

router.use(authenticate, authorize(Role.ADMIN));

router.get('/', async (_req: AuthRequest, res, next) => {
  try {
    const users = await userRepository.findMany({ take: 100 });
    const sanitized = users.map(({ password: _p, refreshToken: _r, ...safe }) => safe);
    sendSuccess(res, sanitized, 'Users fetched');
  } catch (error) {
    next(error);
  }
});

export default router;
