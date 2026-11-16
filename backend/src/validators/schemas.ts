import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['en', 'ur_roman', 'ur']).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
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

// All entries are free-form custom or traditional surah-range recitations
export const recitationSchema = z.object({
  date: z.string().transform((val) => new Date(val)),
  surahNumber: z.number().int().min(0).optional().default(0),
  surahName: z.string().min(1, 'Name is required').max(200).optional(),
  type: z.enum(['entire', 'custom']).optional().default('custom'),
  ayahCount: z.number().int().min(1, 'Count must be at least 1').optional(),
  fromAyah: z.number().int().min(1).optional(),
  toAyah: z.number().int().min(1).optional(),
  notes: z.string().max(500).optional(),
});

export const updateRecitationSchema = z.object({
  date: z.string().transform((val) => new Date(val)).optional(),
  surahNumber: z.number().int().min(0).optional(),
  surahName: z.string().min(1).max(200).optional(),
  type: z.enum(['entire', 'custom']).optional(),
  ayahCount: z.number().int().min(1).optional(),
  fromAyah: z.number().int().min(1).optional(),
  toAyah: z.number().int().min(1).optional(),
  notes: z.string().max(500).optional(),
});

export const createCounterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).trim(),
  surahNumber: z.number().int().min(0).optional(),
  fromAyah: z.number().int().min(1).optional(),
  toAyah: z.number().int().min(1).optional(),
  dailyTarget: z.number().int().min(0).optional(),
  fridayTarget: z.number().int().min(0).optional(),
  initialCount: z.number().int().min(0).optional().default(0),
  initialDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const updateCounterSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  surahNumber: z.number().int().min(0).optional(),
  fromAyah: z.number().int().min(1).optional(),
  toAyah: z.number().int().min(1).optional(),
  dailyTarget: z.number().int().min(0).optional(),
  fridayTarget: z.number().int().min(0).optional(),
  initialCount: z.number().int().min(0).optional(),
  initialDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const addCounterLogSchema = z.object({
  count: z.number().int().min(1, 'Count must be at least 1'),
  date: z.string().optional(),
  notes: z.string().max(500).optional(),
});
