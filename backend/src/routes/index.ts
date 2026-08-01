import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';
import dashboardRoutes from './dashboard.routes';
import adminRoutes from './admin.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use(healthRoutes);
router.use('/auth', authRoutes);
router.use('/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/admin/users', adminRoutes);

export default router;
