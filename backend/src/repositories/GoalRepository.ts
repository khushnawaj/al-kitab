import { Goal, IGoal } from '../models/Goal.js';

export class GoalRepository {
  async findByUserId(userId: string): Promise<IGoal | null> {
    return Goal.findOne({ user: userId });
  }

  async create(goalData: Partial<IGoal>): Promise<IGoal> {
    const goal = new Goal(goalData);
    return goal.save();
  }

  async updateByUserId(userId: string, updateData: Partial<IGoal>): Promise<IGoal | null> {
    return Goal.findOneAndUpdate(
      { user: userId },
      { $set: updateData },
      { new: true, upsert: true } // If it doesn't exist, create it
    );
  }

  async deleteByUserId(userId: string): Promise<any> {
    return Goal.deleteOne({ user: userId });
  }
}
export const goalRepository = new GoalRepository();
