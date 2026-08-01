import { NextFunction, Response } from 'express';
import { TaskPriority } from '@prisma/client';
import { taskService } from '../services/task.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';

export class TaskController {
  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      let payload = req.body.payload;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {
          payload = undefined;
        }
      }

      const file = req.file;
      const result = await taskService.create(req.user!, {
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority as TaskPriority | undefined,
        payload,
        scheduledAt: req.body.scheduledAt || undefined,
        maxRetries: req.body.maxRetries ? Number(req.body.maxRetries) : undefined,
        fileUrl: file ? `/uploads/${file.filename}` : undefined,
        fileName: file?.originalname,
      });
      sendSuccess(res, result, 'Task created and queued', 201);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await taskService.list(req.user!, req.query as never);
      sendSuccess(res, result.items, 'Tasks fetched', 200, {
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await taskService.getById(req.user!, req.params.id);
      sendSuccess(res, result, 'Task fetched');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await taskService.update(req.user!, req.params.id, req.body);
      sendSuccess(res, result, 'Task updated');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await taskService.delete(req.user!, req.params.id);
      sendSuccess(res, result, 'Task deleted');
    } catch (error) {
      next(error);
    }
  };

  retry = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await taskService.retry(req.user!, req.params.id);
      sendSuccess(res, result, 'Task requeued for retry');
    } catch (error) {
      next(error);
    }
  };

  schedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await taskService.schedule(
        req.user!,
        req.params.id,
        req.body.scheduledAt
      );
      sendSuccess(res, result, 'Task scheduled');
    } catch (error) {
      next(error);
    }
  };
}

export const taskController = new TaskController();
