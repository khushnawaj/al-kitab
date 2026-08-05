import mongoose, { Schema } from 'mongoose';
const GoalSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    dailyGoal: { type: Number, required: true, default: 10 },
    weeklyGoal: { type: Number, required: true, default: 70 },
    monthlyGoal: { type: Number, required: true, default: 300 },
}, { timestamps: true });
export const Goal = mongoose.model('Goal', GoalSchema);
