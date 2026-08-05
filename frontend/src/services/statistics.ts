import { api } from './api.js';

export interface StatCharts {
  last7Days: { date: string; label: string; count: number }[];
  topSurahs: { surahNumber: number; name: string; count: number }[];
  monthlyProgress: { month: string; count: number }[];
}

export interface StatisticsData {
  todayCount: number;
  weeklyCount: number;
  monthlyCount: number;
  yearlyCount: number;
  totalAyahs: number;
  averagePerDay: number;
  averagePerWeek: number;
  averagePerMonth: number;
  mostRecitedSurah: string;
  currentStreak: number;
  longestStreak: number;
  goals: {
    daily: number;
    weekly: number;
    monthly: number;
    dailyCompletion: number;
    weeklyCompletion: number;
    monthlyCompletion: number;
  };
  charts: StatCharts;
}

// Calculate statistics locally when offline
const calculateLocalStatistics = (): StatisticsData => {
  const pending = JSON.parse(localStorage.getItem('pending_recitations') || '[]');
  const deletes = JSON.parse(localStorage.getItem('pending_deletes') || '[]');
  let cached = JSON.parse(localStorage.getItem('cached_recitations') || '[]');
  
  // Filter out deletes
  cached = cached.filter((r: any) => !deletes.includes(r._id));
  
  const recitations = [...pending, ...cached];
  
  const cachedGoals = JSON.parse(localStorage.getItem('cached_goals') || '{"dailyGoal":10,"weeklyGoal":70,"monthlyGoal":300}');
  const dailyGoal = cachedGoals.dailyGoal || 10;
  const weeklyGoal = cachedGoals.weeklyGoal || 70;
  const monthlyGoal = cachedGoals.monthlyGoal || 300;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  let todayCount = 0;
  let weeklyCount = 0;
  let monthlyCount = 0;
  let yearlyCount = 0;
  let totalAyahs = 0;

  const surahCounts: { [key: number]: { count: number; name: string } } = {};
  const dailyCounts: { [key: string]: number } = {};

  recitations.forEach((rec: any) => {
    const recDate = new Date(rec.date);
    const recDateStr = recDate.toISOString().split('T')[0];
    const ayahs = rec.ayahCount;

    totalAyahs += ayahs;

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

    if (!surahCounts[rec.surahNumber]) {
      surahCounts[rec.surahNumber] = { count: 0, name: rec.surahName };
    }
    surahCounts[rec.surahNumber].count += ayahs;

    if (!dailyCounts[recDateStr]) {
      dailyCounts[recDateStr] = 0;
    }
    dailyCounts[recDateStr] += ayahs;
  });

  let mostRecitedSurah = 'None';
  let maxSurahCount = 0;
  Object.keys(surahCounts).forEach(key => {
    const num = parseInt(key);
    if (surahCounts[num].count > maxSurahCount) {
      maxSurahCount = surahCounts[num].count;
      mostRecitedSurah = surahCounts[num].name;
    }
  });

  const uniqueDates = Object.keys(dailyCounts).sort((a, b) => b.localeCompare(a));
  let currentStreak = 0;
  let longestStreak = 0;

  if (uniqueDates.length > 0) {
    const lastRecitationDateStr = uniqueDates[0];
    const diffInTimeStr = new Date(todayStr).getTime() - new Date(lastRecitationDateStr).getTime();
    const diffInDaysStr = diffInTimeStr / (1000 * 3600 * 24);

    if (diffInDaysStr <= 1) {
      currentStreak = 1;
      let tempStreak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const current = new Date(uniqueDates[i]);
        const next = new Date(uniqueDates[i + 1]);
        const diffDays = (current.getTime() - next.getTime()) / (1000 * 3600 * 24);

        if (diffDays === 1) {
          tempStreak++;
          if (i === tempStreak - 2) {
            currentStreak = tempStreak;
          }
        } else if (diffDays > 1) {
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
      currentStreak = 0;
    }

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

  let daysSinceFirst = 1;
  if (uniqueDates.length > 0) {
    const firstDate = new Date(uniqueDates[uniqueDates.length - 1]);
    const diffTime = Math.abs(now.getTime() - firstDate.getTime());
    daysSinceFirst = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  const averagePerDay = Math.round(totalAyahs / daysSinceFirst);
  const averagePerWeek = Math.round(totalAyahs / Math.max(1, Math.ceil(daysSinceFirst / 7)));
  const averagePerMonth = Math.round(totalAyahs / Math.max(1, Math.ceil(daysSinceFirst / 30)));

  const dailyGoalCompletion = Math.min(100, Math.round((todayCount / dailyGoal) * 100));
  const weeklyGoalCompletion = Math.min(100, Math.round((weeklyCount / weeklyGoal) * 100));
  const monthlyGoalCompletion = Math.min(100, Math.round((monthlyCount / monthlyGoal) * 100));

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

  const topSurahs = Object.keys(surahCounts)
    .map(key => ({
      surahNumber: parseInt(key),
      name: surahCounts[parseInt(key)].name,
      count: surahCounts[parseInt(key)].count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const monthlyProgress: { month: string; count: number }[] = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = 0; i < 12; i++) {
    let count = 0;
    recitations.forEach((rec: any) => {
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
      daily: dailyGoal,
      weekly: weeklyGoal,
      monthly: monthlyGoal,
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
};

export const statisticsApi = {
  getStatistics: async (): Promise<StatisticsData> => {
    if (!navigator.onLine) {
      return calculateLocalStatistics();
    }
    try {
      const res = await api.get('/statistics');
      const data = res.data.data;
      localStorage.setItem('cached_statistics', JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('API stats fetch failed, falling back to local calculation:', err);
      return calculateLocalStatistics();
    }
  }
};
