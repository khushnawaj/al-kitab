import mongoose, { Schema } from 'mongoose';
const RefreshTokenSchema = new Schema({
    token: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
});
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-expire token
export const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);
