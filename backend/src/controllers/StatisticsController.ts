import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { statisticsService } from '../services/StatisticsService.js';

export class StatisticsController {
  async getStatistics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const stats = await statisticsService.getStatistics(userId);
      res.status(200).json({
        success: true,
        message: 'Statistics calculated successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}
export const statisticsController = new StatisticsController();
