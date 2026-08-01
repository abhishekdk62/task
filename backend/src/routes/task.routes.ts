import { Router } from 'express';
import { z } from 'zod';
import { taskController } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';
import { createTaskSchema, taskQuerySchema, updateTaskSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.post('/', upload.single('file'), validate(createTaskSchema), taskController.create);
router.get('/', validate(taskQuerySchema, 'query'), taskController.list);
router.get('/:id', taskController.getById);
router.patch('/:id', validate(updateTaskSchema), taskController.update);
router.delete('/:id', taskController.delete);
router.post('/:id/retry', taskController.retry);
router.post(
  '/:id/schedule',
  validate(z.object({ scheduledAt: z.string().datetime() })),
  taskController.schedule
);

export default router;
