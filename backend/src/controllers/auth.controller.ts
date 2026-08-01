import { NextFunction, Response } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';

export class AuthController {
  register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body.email, req.body.password);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.refresh(req.body.refreshToken);
      sendSuccess(res, result, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.logout(req.user!.id);
      sendSuccess(res, result, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  };

  me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.me(req.user!.id);
      sendSuccess(res, result, 'Profile fetched');
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
