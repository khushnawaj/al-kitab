import { Goal } from '../models/Goal.js';
export class GoalRepository {
    async findByUserId(userId) {
        return Goal.findOne({ user: userId });
    }
    async create(goalData) {
        const goal = new Goal(goalData);
        return goal.save();
    }
    async updateByUserId(userId, updateData) {
        return Goal.findOneAndUpdate({ user: userId }, { $set: updateData }, { new: true, upsert: true } // If it doesn't exist, create it
        );
    }
    async deleteByUserId(userId) {
        return Goal.deleteOne({ user: userId });
    }
}
export const goalRepository = new GoalRepository();
