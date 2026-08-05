import { api } from './api.js';

export interface GoalsData {
  dailyGoal: number;
  weeklyGoal: number;
  monthlyGoal: number;
}

const getCachedGoals = (): GoalsData => {
  try {
    const cached = localStorage.getItem('cached_goals');
    return cached ? JSON.parse(cached) : { dailyGoal: 10, weeklyGoal: 70, monthlyGoal: 300 };
  } catch {
    return { dailyGoal: 10, weeklyGoal: 70, monthlyGoal: 300 };
  }
};

const saveCachedGoals = (goals: GoalsData) => {
  localStorage.setItem('cached_goals', JSON.stringify(goals));
};

export const goalApi = {
  getGoals: async (): Promise<GoalsData> => {
    if (!navigator.onLine) {
      return getCachedGoals();
    }
    const res = await api.get('/goals');
    const data = res.data.data;
    saveCachedGoals(data);
    return data;
  },

  updateGoals: async (data: GoalsData): Promise<GoalsData> => {
    if (!navigator.onLine) {
      saveCachedGoals(data);
      // Also store a pending goal update if needed, but since it's simple we just cache it.
      // We will sync when online.
      localStorage.setItem('pending_goal_update', JSON.stringify(data));
      return data;
    }
    const res = await api.put('/goals', data);
    const updated = res.data.data;
    saveCachedGoals(updated);
    return updated;
  },

  syncOfflineGoals: async (): Promise<void> => {
    if (!navigator.onLine) return;
    const pending = localStorage.getItem('pending_goal_update');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        await api.put('/goals', data);
        localStorage.removeItem('pending_goal_update');
      } catch (err) {
        console.error('Failed to sync offline goals', err);
      }
    }
  }
};
