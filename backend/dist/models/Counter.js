import mongoose, { Schema } from 'mongoose';
const CounterLogSchema = new Schema({
    count: { type: Number, required: true },
    date: { type: Date, required: true },
    notes: { type: String, trim: true },
}, { timestamps: true });
const CounterSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    surahNumber: { type: Number },
    fromAyah: { type: Number },
    toAyah: { type: Number },
    dailyTarget: { type: Number },
    fridayTarget: { type: Number },
    initialCount: { type: Number, required: true, default: 0 },
    initialDate: { type: Date, required: true, default: Date.now },
    notes: { type: String, trim: true },
    logs: [CounterLogSchema],
}, { timestamps: true });
CounterSchema.index({ user: 1, name: 1 });
export const Counter = mongoose.model('Counter', CounterSchema);
