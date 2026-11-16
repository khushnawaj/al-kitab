import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  recitationSchema,
  updateRecitationSchema,
  createCounterSchema,
  updateCounterSchema,
  addCounterLogSchema,
  goalSchema
} from '../validators/schemas.js';

describe('Validator Schemas', () => {
  describe('registerSchema', () => {
    it('accepts valid registration input', () => {
      const valid = {
        name: 'Fatima Zahra',
        email: 'fatima@example.com',
        password: 'securepassword123',
        language: 'en',
        theme: 'dark'
      };
      const result = registerSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it('rejects short password or invalid email', () => {
      const invalid = {
        name: 'A',
        email: 'not-an-email',
        password: '123'
      };
      const result = registerSchema.safeParse(invalid);
      assert.equal(result.success, false);
      assert.equal(result.error?.issues.length, 3);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login and normalizes email', () => {
      const result = loginSchema.safeParse({
        email: '  USER@EXAMPLE.COM ',
        password: 'password123',
        rememberMe: true
      });
      assert.equal(result.success, true);
      assert.equal(result.data?.email, 'user@example.com');
    });

    it('rejects empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: ''
      });
      assert.equal(result.success, false);
    });
  });

  describe('recitationSchema', () => {
    it('accepts valid recitation date and bounds', () => {
      const result = recitationSchema.safeParse({
        date: '2026-03-15T10:00:00Z',
        surahNumber: 1,
        type: 'entire',
        ayahCount: 7
      });
      assert.equal(result.success, true);
      assert.equal(result.data?.ayahCount, 7);
      assert.equal(result.data?.date instanceof Date, true);
    });

    it('defaults type to custom and surahNumber to 0 if omitted', () => {
      const result = recitationSchema.safeParse({
        date: '2026-03-15',
        surahName: 'Astaghfirullah 100x',
        ayahCount: 100
      });
      assert.equal(result.success, true);
      assert.equal(result.data?.type, 'custom');
      assert.equal(result.data?.surahNumber, 0);
    });
  });

  describe('createCounterSchema & addCounterLogSchema', () => {
    it('accepts valid counter setup', () => {
      const result = createCounterSchema.safeParse({
        name: 'Subhanallah',
        initialCount: 33,
        dailyTarget: 100,
        fridayTarget: 300
      });
      assert.equal(result.success, true);
      assert.equal(result.data?.name, 'Subhanallah');
      assert.equal(result.data?.initialCount, 33);
    });

    it('rejects empty counter name', () => {
      const result = createCounterSchema.safeParse({
        name: ''
      });
      assert.equal(result.success, false);
    });

    it('validates counter log entries', () => {
      const valid = addCounterLogSchema.safeParse({ count: 50, notes: 'After Fajr' });
      assert.equal(valid.success, true);

      const invalid = addCounterLogSchema.safeParse({ count: 0 });
      assert.equal(invalid.success, false);
    });
  });

  describe('goalSchema', () => {
    it('accepts valid goal thresholds', () => {
      const result = goalSchema.safeParse({
        dailyGoal: 20,
        weeklyGoal: 140,
        monthlyGoal: 600
      });
      assert.equal(result.success, true);
    });

    it('rejects non-positive goals', () => {
      const result = goalSchema.safeParse({
        dailyGoal: 0,
        weeklyGoal: -5,
        monthlyGoal: 100
      });
      assert.equal(result.success, false);
    });
  });
});
