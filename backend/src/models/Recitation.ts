import mongoose, { Schema, Document } from 'mongoose';

export interface IRecitation extends Document {
  user: mongoose.Types.ObjectId;
  date: Date;
  surahNumber: number;
  surahName: string;
  type: 'entire' | 'custom';
  fromAyah?: number;
  toAyah?: number;
  ayahCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecitationSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    surahNumber: { type: Number, required: true },
    surahName: { type: String, required: true },
    type: { type: String, enum: ['entire', 'custom'], required: true },
    fromAyah: { type: Number },
    toAyah: { type: Number },
    ayahCount: { type: Number, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Add index on user and date for quick query of stats
RecitationSchema.index({ user: 1, date: -1 });

export const Recitation = mongoose.model<IRecitation>('Recitation', RecitationSchema);
