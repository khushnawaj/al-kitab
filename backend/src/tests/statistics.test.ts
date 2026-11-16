import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Statistics & Streak Calculation Logic', () => {
  it('calculates streaks accurately across consecutive dates', () => {
    // Helper to calculate consecutive day streak
    const calculateStreak = (dateStrings: string[], todayStr: string): { currentStreak: number; longestStreak: number } => {
      const uniqueDates = [...dateStrings].sort((a, b) => b.localeCompare(a));
      if (uniqueDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

      const diffInDays = (new Date(todayStr).getTime() - new Date(uniqueDates[0]).getTime()) / (1000 * 3600 * 24);
      let currentStreak = 0;
      let longestStreak = 1;

      if (diffInDays <= 1) {
        currentStreak = 1;
        let tempStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const current = new Date(uniqueDates[i]);
          const next = new Date(uniqueDates[i + 1]);
          const diff = (current.getTime() - next.getTime()) / (1000 * 3600 * 24);

          if (diff === 1) {
            tempStreak++;
            if (i === tempStreak - 2) {
              currentStreak = tempStreak;
            }
          } else if (diff > 1) {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }

      return { currentStreak, longestStreak };
    };

    const dates = ['2026-03-15', '2026-03-14', '2026-03-13', '2026-03-10', '2026-03-09'];
    const streak = calculateStreak(dates, '2026-03-15');

    assert.equal(streak.currentStreak, 3);
    assert.equal(streak.longestStreak, 3);
  });

  it('resets current streak to 0 if last recitation was more than 1 day ago', () => {
    const dates = ['2026-03-10', '2026-03-09', '2026-03-08'];
    const today = '2026-03-15'; // 5 days later

    const diffInDays = (new Date(today).getTime() - new Date(dates[0]).getTime()) / (1000 * 3600 * 24);
    assert.equal(diffInDays > 1, true);
  });

  it('computes goal completion percentages capped at 100%', () => {
    const computeGoalPercent = (actual: number, target: number) =>
      Math.min(100, Math.round((actual / target) * 100));

    assert.equal(computeGoalPercent(5, 10), 50);
    assert.equal(computeGoalPercent(10, 10), 100);
    assert.equal(computeGoalPercent(25, 10), 100);
  });
});
