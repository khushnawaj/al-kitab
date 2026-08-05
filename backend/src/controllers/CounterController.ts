import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { counterService } from '../services/CounterService.js';

export class CounterController {
  async getCounters(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const counters = await counterService.listCounters(userId);
      res.status(200).json({
        success: true,
        message: 'Counters retrieved successfully',
        data: counters
      });
    } catch (error) {
      next(error);
    }
  }

  async getCounterById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const counter = await counterService.getCounter(userId, id as string);
      res.status(200).json({
        success: true,
        message: 'Counter retrieved successfully',
        data: counter
      });
    } catch (error) {
      next(error);
    }
  }

  async createCounter(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const counter = await counterService.createCounter(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Counter created successfully',
        data: counter
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCounter(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const counter = await counterService.updateCounter(userId, id as string, req.body);
      res.status(200).json({
        success: true,
        message: 'Counter updated successfully',
        data: counter
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCounter(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const deleted = await counterService.deleteCounter(userId, id as string);
      res.status(200).json({
        success: true,
        message: 'Counter deleted successfully',
        data: deleted
      });
    } catch (error) {
      next(error);
    }
  }

  async addLog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const counter = await counterService.addLog(userId, id as string, req.body);
      res.status(200).json({
        success: true,
        message: 'Count logged successfully',
        data: counter
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteLog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id, logId } = req.params;
      const counter = await counterService.deleteLog(userId, id as string, logId as string);
      res.status(200).json({
        success: true,
        message: 'Log entry deleted successfully',
        data: counter
      });
    } catch (error) {
      next(error);
    }
  }
}

export const counterController = new CounterController();
