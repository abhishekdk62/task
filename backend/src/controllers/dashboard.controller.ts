import { NextFunction, Response } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';

export class DashboardController {
  stats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await dashboardService.getStats(req.user!);
      sendSuccess(res, result, 'Dashboard stats fetched');
    } catch (error) {
      next(error);
    }
  };
}

export const dashboardController = new DashboardController();
