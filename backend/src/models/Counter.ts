import mongoose, { Schema, Document } from 'mongoose';

export interface ICounterLog {
  _id?: mongoose.Types.ObjectId;
  count: number;
  date: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICounter extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  surahNumber?: number;
  fromAyah?: number;
  toAyah?: number;
  dailyTarget?: number;
  fridayTarget?: number;
  initialCount: number;
  initialDate: Date;
  notes?: string;
  logs: ICounterLog[];
  createdAt: Date;
  updatedAt: Date;
}

const CounterLogSchema: Schema = new Schema(
  {
    count: { type: Number, required: true },
    date: { type: Date, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const CounterSchema: Schema = new Schema(
  {
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
  },
  { timestamps: true }
);

CounterSchema.index({ user: 1, name: 1 });

export const Counter = mongoose.model<ICounter>('Counter', CounterSchema);
