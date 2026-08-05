import mongoose, { Schema } from 'mongoose';
const RecitationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    surahNumber: { type: Number, required: true },
    surahName: { type: String, required: true },
    type: { type: String, enum: ['entire', 'custom'], required: true },
    fromAyah: { type: Number },
    toAyah: { type: Number },
    ayahCount: { type: Number, required: true },
    notes: { type: String, trim: true },
}, { timestamps: true });
// Add index on user and date for quick query of stats
RecitationSchema.index({ user: 1, date: -1 });
export const Recitation = mongoose.model('Recitation', RecitationSchema);
