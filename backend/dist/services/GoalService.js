import { goalRepository } from '../repositories/GoalRepository.js';
export class GoalService {
    async getGoals(userId) {
        let goal = await goalRepository.findByUserId(userId);
        if (!goal) {
            // If no goals record exists, create one with default values
            goal = await goalRepository.create({
                user: userId,
                dailyGoal: 10,
                weeklyGoal: 70,
                monthlyGoal: 300,
            });
        }
        return {
            dailyGoal: goal.dailyGoal,
            weeklyGoal: goal.weeklyGoal,
            monthlyGoal: goal.monthlyGoal,
        };
    }
    async updateGoals(userId, data) {
        const updated = await goalRepository.updateByUserId(userId, data);
        if (!updated) {
            throw { status: 404, message: 'Goals not found' };
        }
        return {
            dailyGoal: updated.dailyGoal,
            weeklyGoal: updated.weeklyGoal,
            monthlyGoal: updated.monthlyGoal,
        };
    }
}
export const goalService = new GoalService();
