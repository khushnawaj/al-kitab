import { recitationService } from '../services/RecitationService.js';
export class RecitationController {
    async getRecitations(req, res, next) {
        try {
            const userId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const sortField = req.query.sortField || 'date';
            const sortOrder = req.query.sortOrder || 'desc';
            const filters = {};
            if (req.query.surahNumber) {
                filters.surahNumber = parseInt(req.query.surahNumber);
            }
            if (req.query.startDate) {
                filters.startDate = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filters.endDate = new Date(req.query.endDate);
            }
            if (req.query.search) {
                filters.search = req.query.search;
            }
            const result = await recitationService.listRecitations(userId, filters, sortField, sortOrder, page, limit);
            res.status(200).json({
                success: true,
                message: 'Recitations retrieved successfully',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getRecitationById(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const recitation = await recitationService.getRecitation(userId, id);
            res.status(200).json({
                success: true,
                message: 'Recitation retrieved successfully',
                data: recitation
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createRecitation(req, res, next) {
        try {
            const userId = req.user.userId;
            const recitation = await recitationService.createRecitation(userId, req.body);
            res.status(201).json({
                success: true,
                message: 'Recitation recorded successfully',
                data: recitation
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateRecitation(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const recitation = await recitationService.updateRecitation(userId, id, req.body);
            res.status(200).json({
                success: true,
                message: 'Recitation updated successfully',
                data: recitation
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteRecitation(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const deleted = await recitationService.deleteRecitation(userId, id);
            res.status(200).json({
                success: true,
                message: 'Recitation record deleted successfully',
                data: deleted
            });
        }
        catch (error) {
            next(error);
        }
    }
    async exportRecitations(req, res, next) {
        try {
            const userId = req.user.userId;
            const data = await recitationService.exportData(userId);
            res.status(200).json({
                success: true,
                message: 'Recitations exported successfully',
                data
            });
        }
        catch (error) {
            next(error);
        }
    }
    async importRecitations(req, res, next) {
        try {
            const userId = req.user.userId;
            const { data } = req.body;
            const result = await recitationService.importData(userId, data);
            res.status(200).json({
                success: true,
                message: `Successfully imported ${result.count} recitation records`,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export const recitationController = new RecitationController();
