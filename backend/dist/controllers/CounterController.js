import { counterService } from '../services/CounterService.js';
export class CounterController {
    async getCounters(req, res, next) {
        try {
            const userId = req.user.userId;
            const counters = await counterService.listCounters(userId);
            res.status(200).json({
                success: true,
                message: 'Counters retrieved successfully',
                data: counters
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getCounterById(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const counter = await counterService.getCounter(userId, id);
            res.status(200).json({
                success: true,
                message: 'Counter retrieved successfully',
                data: counter
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createCounter(req, res, next) {
        try {
            const userId = req.user.userId;
            const counter = await counterService.createCounter(userId, req.body);
            res.status(201).json({
                success: true,
                message: 'Counter created successfully',
                data: counter
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateCounter(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const counter = await counterService.updateCounter(userId, id, req.body);
            res.status(200).json({
                success: true,
                message: 'Counter updated successfully',
                data: counter
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteCounter(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const deleted = await counterService.deleteCounter(userId, id);
            res.status(200).json({
                success: true,
                message: 'Counter deleted successfully',
                data: deleted
            });
        }
        catch (error) {
            next(error);
        }
    }
    async addLog(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;
            const counter = await counterService.addLog(userId, id, req.body);
            res.status(200).json({
                success: true,
                message: 'Count logged successfully',
                data: counter
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteLog(req, res, next) {
        try {
            const userId = req.user.userId;
            const { id, logId } = req.params;
            const counter = await counterService.deleteLog(userId, id, logId);
            res.status(200).json({
                success: true,
                message: 'Log entry deleted successfully',
                data: counter
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export const counterController = new CounterController();
