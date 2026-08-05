import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { recitationService } from '../services/RecitationService.js';

export class RecitationController {
  async getRecitations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortField = (req.query.sortField as string) || 'date';
      const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';
      
      const filters: any = {};
      if (req.query.surahNumber) {
        filters.surahNumber = parseInt(req.query.surahNumber as string);
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const result = await recitationService.listRecitations(
        userId,
        filters,
        sortField,
        sortOrder,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        message: 'Recitations retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecitationById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const recitation = await recitationService.getRecitation(userId, id as string);
      res.status(200).json({
        success: true,
        message: 'Recitation retrieved successfully',
        data: recitation
      });
    } catch (error) {
      next(error);
    }
  }

  async createRecitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const recitation = await recitationService.createRecitation(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Recitation recorded successfully',
        data: recitation
      });
    } catch (error) {
      next(error);
    }
  }

  async updateRecitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const recitation = await recitationService.updateRecitation(userId, id as string, req.body);
      res.status(200).json({
        success: true,
        message: 'Recitation updated successfully',
        data: recitation
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteRecitation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const deleted = await recitationService.deleteRecitation(userId, id as string);
      res.status(200).json({
        success: true,
        message: 'Recitation record deleted successfully',
        data: deleted
      });
    } catch (error) {
      next(error);
    }
  }

  async exportRecitations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await recitationService.exportData(userId);
      res.status(200).json({
        success: true,
        message: 'Recitations exported successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async importRecitations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { data } = req.body;
      const result = await recitationService.importData(userId, data);
      res.status(200).json({
        success: true,
        message: `Successfully imported ${result.count} recitation records`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
export const recitationController = new RecitationController();
