import { recitationRepository } from '../repositories/RecitationRepository.js';
import { goalRepository } from '../repositories/GoalRepository.js';
import { SURAHS } from '../constants/surahs.js';

export class StatisticsService {
  async getStatistics(userId: string) {
    const recitations = await recitationRepository.findByUserId(userId);
    const goals = await goalRepository.findByUserId(userId) || { dailyGoal: 10, weeklyGoal: 70, monthlyGoal: 300 };

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Helpers for date filtering
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday as start of week
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let todayCount = 0;
    let weeklyCount = 0;
    let monthlyCount = 0;
    let yearlyCount = 0;
    let totalAyahs = 0;

    const surahCounts: { [key: number]: { count: number; name: string } } = {};
    const dailyCounts: { [key: string]: number } = {};

    recitations.forEach(rec => {
      const recDate = new Date(rec.date);
      const recDateStr = recDate.toISOString().split('T')[0];
      const ayahs = rec.ayahCount;

      totalAyahs += ayahs;

      // Time periods
      if (recDate >= startOfToday) {
        todayCount += ayahs;
      }
      if (recDate >= startOfWeek) {
        weeklyCount += ayahs;
      }
      if (recDate >= startOfMonth) {
        monthlyCount += ayahs;
      }
      if (recDate >= startOfYear) {
        yearlyCount += ayahs;
      }

      // Surah frequency
      if (!surahCounts[rec.surahNumber]) {
        surahCounts[rec.surahNumber] = { count: 0, name: rec.surahName };
      }
      surahCounts[rec.surahNumber].count += ayahs;

      // Group by date for streaks and averages
      if (!dailyCounts[recDateStr]) {
        dailyCounts[recDateStr] = 0;
      }
      dailyCounts[recDateStr] += ayahs;
    });

    // Find most recited Surah
    let mostRecitedSurah = 'None';
    let maxSurahCount = 0;
    Object.keys(surahCounts).forEach(key => {
      const num = parseInt(key);
      if (surahCounts[num].count > maxSurahCount) {
        maxSurahCount = surahCounts[num].count;
        mostRecitedSurah = surahCounts[num].name;
      }
    });

    // Calculate streaks
    const uniqueDates = Object.keys(dailyCounts).sort((a, b) => b.localeCompare(a)); // Descending order (newest first)
    let currentStreak = 0;
    let longestStreak = 0;

    if (uniqueDates.length > 0) {
      // Check if current streak is active
      const lastRecitationDateStr = uniqueDates[0];
      const diffInTimeStr = new Date(todayStr).getTime() - new Date(lastRecitationDateStr).getTime();
      const diffInDaysStr = diffInTimeStr / (1000 * 3600 * 24);

      // If last recitation was today or yesterday, streak is active
      if (diffInDaysStr <= 1) {
        currentStreak = 1;
        let tempStreak = 1;
        for (let i = 0; i < uniqueDates.length - 1; i++) {
          const current = new Date(uniqueDates[i]);
          const next = new Date(uniqueDates[i + 1]);
          const diffDays = (current.getTime() - next.getTime()) / (1000 * 3600 * 24);
          
          if (diffDays === 1) {
            tempStreak++;
            // If we are still building the current active streak
            if (i === tempStreak - 2) {
              currentStreak = tempStreak;
            }
          } else if (diffDays > 1) {
            // Broken streak
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
            tempStreak = 1;
          }
        }
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        // Streak is 0 because last recitation was more than 1 day ago
        currentStreak = 0;
      }

      // Calculate longest streak overall
      let tempStreak = 1;
      longestStreak = Math.max(longestStreak, 1);
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = new Date(uniqueDates[i]);
        const next = new Date(uniqueDates[i + 1]);
        const diffDays = (current.getTime() - next.getTime()) / (1000 * 3600 * 24);

        if (diffDays === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Averages
    const totalDays = recitations.length > 0 ? Math.max(1, uniqueDates.length) : 1;
    // Calculate days since first recitation to make average realistic
    let daysSinceFirst = 1;
    if (uniqueDates.length > 0) {
      const firstDate = new Date(uniqueDates[uniqueDates.length - 1]);
      const diffTime = Math.abs(now.getTime() - firstDate.getTime());
      daysSinceFirst = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    
    const averagePerDay = Math.round(totalAyahs / daysSinceFirst);
    const averagePerWeek = Math.round(totalAyahs / Math.max(1, Math.ceil(daysSinceFirst / 7)));
    const averagePerMonth = Math.round(totalAyahs / Math.max(1, Math.ceil(daysSinceFirst / 30)));

    // Goal completions
    const dailyGoalCompletion = Math.min(100, Math.round((todayCount / goals.dailyGoal) * 100));
    const weeklyGoalCompletion = Math.min(100, Math.round((weeklyCount / goals.weeklyGoal) * 100));
    const monthlyGoalCompletion = Math.min(100, Math.round((monthlyCount / goals.monthlyGoal) * 100));

    // Last 7 days chart data
    const last7Days: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      last7Days.push({
        date: dStr,
        label,
        count: dailyCounts[dStr] || 0
      });
    }

    // Top 5 recited Surahs for Pie Chart
    const topSurahs = Object.keys(surahCounts)
      .map(key => ({
        surahNumber: parseInt(key),
        name: surahCounts[parseInt(key)].name,
        count: surahCounts[parseInt(key)].count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Monthly recitation pattern for the Line Chart (current year)
    const monthlyProgress: { month: string; count: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 0; i < 12; i++) {
      let count = 0;
      recitations.forEach(rec => {
        const recDate = new Date(rec.date);
        if (recDate.getFullYear() === now.getFullYear() && recDate.getMonth() === i) {
          count += rec.ayahCount;
        }
      });
      monthlyProgress.push({ month: months[i], count });
    }

    return {
      todayCount,
      weeklyCount,
      monthlyCount,
      yearlyCount,
      totalAyahs,
      averagePerDay,
      averagePerWeek,
      averagePerMonth,
      mostRecitedSurah,
      currentStreak,
      longestStreak,
      goals: {
        daily: goals.dailyGoal,
        weekly: goals.weeklyGoal,
        monthly: goals.monthlyGoal,
        dailyCompletion: dailyGoalCompletion,
        weeklyCompletion: weeklyGoalCompletion,
        monthlyCompletion: monthlyGoalCompletion
      },
      charts: {
        last7Days,
        topSurahs,
        monthlyProgress
      }
    };
  }
}
export const statisticsService = new StatisticsService();
