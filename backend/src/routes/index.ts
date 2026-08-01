import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'TaskFlow API is healthy',
    data: { uptime: process.uptime(), timestamp: new Date().toISOString() },
  });
});

router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
