import { api } from './api.js';

export interface CounterLog {
  _id: string;
  count: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CounterRecord {
  _id: string;
  name: string;
  surahNumber?: number;
  fromAyah?: number;
  toAyah?: number;
  dailyTarget?: number;
  fridayTarget?: number;
  initialCount: number;
  initialDate: string;
  notes?: string;
  logs: CounterLog[];
  createdAt: string;
  updatedAt: string;
}

// Helpers for Offline Sync
const getPendingCounters = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('pending_counters') || '[]');
  } catch {
    return [];
  }
};

const savePendingCounters = (pending: any[]) => {
  localStorage.setItem('pending_counters', JSON.stringify(pending));
};

const getPendingCounterDeletes = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('pending_counter_deletes') || '[]');
  } catch {
    return [];
  }
};

const savePendingCounterDeletes = (deletes: string[]) => {
  localStorage.setItem('pending_counter_deletes', JSON.stringify(deletes));
};

const getCachedCounters = (): CounterRecord[] => {
  try {
    return JSON.parse(localStorage.getItem('cached_counters') || '[]');
  } catch {
    return [];
  }
};

const saveCachedCounters = (records: CounterRecord[]) => {
  localStorage.setItem('cached_counters', JSON.stringify(records));
};

// Pending logs to add to existing counters while offline
interface PendingCounterLog {
  counterId: string;
  count: number;
  date: string;
  notes?: string;
  tempLogId: string;
}

const getPendingCounterLogs = (): PendingCounterLog[] => {
  try {
    return JSON.parse(localStorage.getItem('pending_counter_logs') || '[]');
  } catch {
    return [];
  }
};

const savePendingCounterLogs = (logs: PendingCounterLog[]) => {
  localStorage.setItem('pending_counter_logs', JSON.stringify(logs));
};

export const counterApi = {
  getCounters: async (): Promise<CounterRecord[]> => {
    if (!navigator.onLine) {
      // Offline: serve from cache + pending creations, minus pending deletes, with pending logs merged
      let cached = getCachedCounters();
      const pending = getPendingCounters();
      const deletes = getPendingCounterDeletes();
      const pendingLogs = getPendingCounterLogs();

      // Filter deletes
      cached = cached.filter(c => !deletes.includes(c._id));

      // Merge
      let allCounters = [...pending, ...cached];

      // Merge pending logs into the counters
      allCounters = allCounters.map(counter => {
        const logsForThisCounter = pendingLogs.filter(pl => pl.counterId === counter._id);
        if (logsForThisCounter.length > 0) {
          const mergedLogs = [
            ...logsForThisCounter.map(pl => ({
              _id: pl.tempLogId,
              count: pl.count,
              date: pl.date,
              notes: pl.notes,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })),
            ...counter.logs
          ];
          return { ...counter, logs: mergedLogs };
        }
        return counter;
      });

      return allCounters;
    }

    const res = await api.get('/counters');
    const data = res.data.data;
    saveCachedCounters(data);
    return data;
  },

  getCounter: async (id: string): Promise<CounterRecord> => {
    if (!navigator.onLine) {
      const counters = await counterApi.getCounters();
      const counter = counters.find(c => c._id === id);
      if (!counter) throw new Error('Counter not found offline');
      return counter;
    }

    const res = await api.get(`/counters/${id}`);
    return res.data.data;
  },

  createCounter: async (data: {
    name: string;
    surahNumber?: number;
    fromAyah?: number;
    toAyah?: number;
    dailyTarget?: number;
    fridayTarget?: number;
    initialCount?: number;
    initialDate?: string;
    notes?: string;
  }): Promise<CounterRecord> => {
    if (!navigator.onLine) {
      const mockCounter: CounterRecord = {
        _id: `offline_counter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        surahNumber: data.surahNumber,
        fromAyah: data.fromAyah,
        toAyah: data.toAyah,
        dailyTarget: data.dailyTarget,
        fridayTarget: data.fridayTarget,
        initialCount: data.initialCount || 0,
        initialDate: data.initialDate || new Date().toISOString().split('T')[0],
        notes: data.notes,
        logs: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const pending = getPendingCounters();
      pending.push(mockCounter);
      savePendingCounters(pending);

      return mockCounter;
    }

    const res = await api.post('/counters', data);
    return res.data.data;
  },

  updateCounter: async (id: string, data: any): Promise<CounterRecord> => {
    if (!navigator.onLine) {
      if (id.startsWith('offline_counter_')) {
        const pending = getPendingCounters();
        const idx = pending.findIndex(c => c._id === id);
        if (idx !== -1) {
          pending[idx] = { ...pending[idx], ...data, updatedAt: new Date().toISOString() };
          savePendingCounters(pending);
          return pending[idx];
        }
      }
      throw new Error('Editing online counters is only supported while online.');
    }

    const res = await api.put(`/counters/${id}`, data);
    return res.data.data;
  },

  deleteCounter: async (id: string): Promise<CounterRecord> => {
    if (!navigator.onLine) {
      if (id.startsWith('offline_counter_')) {
        const pending = getPendingCounters();
        savePendingCounters(pending.filter(c => c._id !== id));
      } else {
        const deletes = getPendingCounterDeletes();
        deletes.push(id);
        savePendingCounterDeletes(deletes);
      }
      return { _id: id } as CounterRecord;
    }

    const res = await api.delete(`/counters/${id}`);
    return res.data.data;
  },

  addLog: async (counterId: string, data: { count: number; date: string; notes?: string }): Promise<CounterRecord> => {
    if (!navigator.onLine) {
      const tempLogId = `offline_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pendingLogs = getPendingCounterLogs();
      pendingLogs.push({
        counterId,
        count: data.count,
        date: data.date,
        notes: data.notes,
        tempLogId
      });
      savePendingCounterLogs(pendingLogs);

      // Return updated counter from local view
      const counters = await counterApi.getCounters();
      return counters.find(c => c._id === counterId) || ({ _id: counterId } as CounterRecord);
    }

    const res = await api.post(`/counters/${counterId}/logs`, data);
    return res.data.data;
  },

  deleteLog: async (counterId: string, logId: string): Promise<CounterRecord> => {
    if (!navigator.onLine) {
      if (logId.startsWith('offline_log_')) {
        const pendingLogs = getPendingCounterLogs();
        savePendingCounterLogs(pendingLogs.filter(pl => pl.tempLogId !== logId));
      } else {
        throw new Error('Deleting server logs is only supported while online.');
      }
      const counters = await counterApi.getCounters();
      return counters.find(c => c._id === counterId) || ({ _id: counterId } as CounterRecord);
    }

    const res = await api.delete(`/counters/${counterId}/logs/${logId}`);
    return res.data.data;
  },

  syncOfflineCounters: async (): Promise<number> => {
    if (!navigator.onLine) return 0;

    const pending = getPendingCounters();
    const deletes = getPendingCounterDeletes();
    const pendingLogs = getPendingCounterLogs();
    let syncCount = 0;

    // 1. Process deletes
    if (deletes.length > 0) {
      for (const id of deletes) {
        try {
          await api.delete(`/counters/${id}`);
          syncCount++;
        } catch (err) {
          console.error(`Failed to sync counter delete ${id}`, err);
        }
      }
      savePendingCounterDeletes([]);
    }

    // 2. Process creations
    // Maps temporary offline counter IDs to their newly created online MongoDB IDs
    const idMap: { [key: string]: string } = {};

    if (pending.length > 0) {
      for (const c of pending) {
        try {
          const res = await api.post('/counters', {
            name: c.name,
            surahNumber: c.surahNumber,
            fromAyah: c.fromAyah,
            toAyah: c.toAyah,
            dailyTarget: c.dailyTarget,
            fridayTarget: c.fridayTarget,
            initialCount: c.initialCount,
            initialDate: c.initialDate,
            notes: c.notes
          });
          const newCounter = res.data.data;
          idMap[c._id] = newCounter._id;
          syncCount++;
        } catch (err) {
          console.error(`Failed to sync counter creation`, err);
        }
      }
      savePendingCounters([]);
    }

    // 3. Process logs
    if (pendingLogs.length > 0) {
      for (const pl of pendingLogs) {
        try {
          // If the counter was created offline, resolve its new online ID
          const targetId = pl.counterId.startsWith('offline_counter_') 
            ? idMap[pl.counterId] 
            : pl.counterId;

          if (targetId) {
            await api.post(`/counters/${targetId}/logs`, {
              count: pl.count,
              date: pl.date,
              notes: pl.notes
            });
            syncCount++;
          }
        } catch (err) {
          console.error(`Failed to sync counter log`, err);
        }
      }
      savePendingCounterLogs([]);
    }

    return syncCount;
  }
};

export const getPendingCountersCount = (): number => {
  return getPendingCounters().length + getPendingCounterDeletes().length + getPendingCounterLogs().length;
};
