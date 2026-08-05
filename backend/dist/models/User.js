import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, enum: ['en', 'ur_roman', 'ur'], default: 'en' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });
export const User = mongoose.model('User', UserSchema);
