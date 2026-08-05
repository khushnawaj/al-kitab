import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  user: mongoose.Types.ObjectId;
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dailyGoal: { type: Number, required: true, default: 10 },
    weeklyGoal: { type: Number, required: true, default: 70 },
    monthlyGoal: { type: Number, required: true, default: 300 },
  },
  { timestamps: true }
);

export const Goal = mongoose.model<IGoal>('Goal', GoalSchema);
