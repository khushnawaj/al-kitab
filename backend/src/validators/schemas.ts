import { z } from 'zod';
import { SURAHS } from '../constants/surahs.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['en', 'ur_roman', 'ur']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  email: z.string().email('Invalid email address').toLowerCase().trim().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['en', 'ur_roman', 'ur']).optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const verifyPasswordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const goalSchema = z.object({
  dailyGoal: z.number().int().min(1, 'Daily goal must be at least 1 ayah'),
  weeklyGoal: z.number().int().min(1, 'Weekly goal must be at least 1 ayah'),
  monthlyGoal: z.number().int().min(1, 'Monthly goal must be at least 1 ayah'),
});

const baseRecitationSchema = z.object({
  date: z.string().transform((val) => new Date(val)),
  surahNumber: z.number().int().min(1).max(114),
  type: z.enum(['entire', 'custom']),
  fromAyah: z.number().int().min(1).optional(),
  toAyah: z.number().int().min(1).optional(),
  notes: z.string().max(500).optional(),
});

export const recitationSchema = baseRecitationSchema.refine((data) => {
  const surah = SURAHS.find(s => s.number === data.surahNumber);
  if (!surah) return false;

  if (data.type === 'custom') {
    if (data.fromAyah === undefined || data.toAyah === undefined) {
      return false;
    }
    if (data.fromAyah > data.toAyah) {
      return false;
    }
    if (data.toAyah > surah.totalAyahs) {
      return false;
    }
  }
  return true;
}, {
  message: "Invalid ayah range for the selected Surah",
  path: ["toAyah"]
});

export const updateRecitationSchema = baseRecitationSchema.partial().refine((data) => {
  if (data.type === 'custom') {
    // If they are updating to custom, we require fromAyah and toAyah if they are provided,
    // or if they are already in the DB. We validate them if present.
    if (data.fromAyah !== undefined && data.toAyah !== undefined) {
      if (data.fromAyah > data.toAyah) return false;
      
      if (data.surahNumber !== undefined) {
        const surah = SURAHS.find(s => s.number === data.surahNumber);
        if (surah && data.toAyah > surah.totalAyahs) return false;
      }
    }
  }
  return true;
}, {
  message: "Invalid ayah range for the selected Surah",
  path: ["toAyah"]
});
