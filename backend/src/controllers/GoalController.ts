import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { goalService } from '../services/GoalService.js';

export class GoalController {
  async getGoals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const goals = await goalService.getGoals(userId);
      res.status(200).json({
        success: true,
        message: 'Goals retrieved successfully',
        data: goals
      });
    } catch (error) {
      next(error);
    }
  }

  async updateGoals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await goalService.updateGoals(userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Goals updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
export const goalController = new GoalController();
