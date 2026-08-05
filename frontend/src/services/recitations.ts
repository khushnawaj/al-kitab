import { api } from './api.js';

export interface RecitationRecord {
  _id: string;
  date: string;
  surahNumber: number;
  surahName: string;
  type: 'entire' | 'custom';
  fromAyah?: number;
  toAyah?: number;
  ayahCount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecitationsResponse {
  recitations: RecitationRecord[];
  total: number;
}

// Helpers for Offline Sync
const getPendingRecitations = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('pending_recitations') || '[]');
  } catch {
    return [];
  }
};

const savePendingRecitations = (pending: any[]) => {
  localStorage.setItem('pending_recitations', JSON.stringify(pending));
};

const getPendingDeletes = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('pending_deletes') || '[]');
  } catch {
    return [];
  }
};

const savePendingDeletes = (deletes: string[]) => {
  localStorage.setItem('pending_deletes', JSON.stringify(deletes));
};

const getCachedRecitations = (): RecitationRecord[] => {
  try {
    return JSON.parse(localStorage.getItem('cached_recitations') || '[]');
  } catch {
    return [];
  }
};

const saveCachedRecitations = (records: RecitationRecord[]) => {
  localStorage.setItem('cached_recitations', JSON.stringify(records));
};

export const recitationApi = {
  getRecitations: async (params: any = {}): Promise<RecitationsResponse> => {
    if (!navigator.onLine) {
      // Offline mode: Serve from cache + merge pending, filter out pending deletes
      let cached = getCachedRecitations();
      const pending = getPendingRecitations();
      const pendingDeletes = getPendingDeletes();

      // Filter out deleted ones
      cached = cached.filter(r => !pendingDeletes.includes(r._id));

      // Append pending creations
      let allRecords = [...pending, ...cached];

      // Apply filtering locally
      if (params.surahNumber) {
        allRecords = allRecords.filter(r => r.surahNumber === parseInt(params.surahNumber));
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        allRecords = allRecords.filter(r => 
          r.surahName.toLowerCase().includes(query) || 
          (r.notes && r.notes.toLowerCase().includes(query))
        );
      }
      if (params.startDate) {
        const start = new Date(params.startDate);
        allRecords = allRecords.filter(r => new Date(r.date) >= start);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        allRecords = allRecords.filter(r => new Date(r.date) <= end);
      }

      // Apply sorting
      const sortField = params.sortField || 'date';
      const sortOrder = params.sortOrder || 'desc';
      allRecords.sort((a: any, b: any) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });

      // Pagination
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 10;
      const skip = (page - 1) * limit;
      const paginated = allRecords.slice(skip, skip + limit);

      return {
        recitations: paginated,
        total: allRecords.length
      };
    }

    const res = await api.get('/recitations', { params });
    const data = res.data.data;
    
    // Save to cache for offline availability (only cache page 1 for general history caching)
    if (!params.surahNumber && !params.search && !params.startDate && !params.endDate && (!params.page || params.page === 1)) {
      saveCachedRecitations(data.recitations);
    }
    return data;
  },

  getRecitation: async (id: string): Promise<RecitationRecord> => {
    if (!navigator.onLine) {
      const all = [...getPendingRecitations(), ...getCachedRecitations()];
      const record = all.find(r => r._id === id);
      if (!record) throw new Error('Recitation not found offline');
      return record;
    }
    const res = await api.get(`/recitations/${id}`);
    return res.data.data;
  },

  createRecitation: async (data: any): Promise<RecitationRecord> => {
    if (!navigator.onLine) {
      // Offline: Generate mock id and store locally
      const mockRecord: RecitationRecord = {
        _id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: data.date,
        surahNumber: data.surahNumber,
        surahName: data.surahName || 'Surah', // will be filled correctly on sync or select
        type: data.type,
        fromAyah: data.fromAyah,
        toAyah: data.toAyah,
        ayahCount: data.ayahCount,
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const pending = getPendingRecitations();
      pending.unshift(mockRecord);
      savePendingRecitations(pending);

      // Trigger sync listener later when online
      return mockRecord;
    }

    const res = await api.post('/recitations', data);
    return res.data.data;
  },

  updateRecitation: async (id: string, data: any): Promise<RecitationRecord> => {
    if (!navigator.onLine) {
      // If it is an offline record, edit it directly in pending
      if (id.startsWith('offline_')) {
        const pending = getPendingRecitations();
        const index = pending.findIndex(r => r._id === id);
        if (index !== -1) {
          pending[index] = { ...pending[index], ...data, updatedAt: new Date().toISOString() };
          savePendingRecitations(pending);
          return pending[index];
        }
      } else {
        // Edit cached online record. We can create a pending update action or just wait.
        // For simplicity, we just block editing online records when offline, or edit cache and queue.
        // Let's queue the edit by marking it. Since simplicity is priority, we can let user edit offline-created records.
        throw new Error('Editing pre-existing records is only supported online.');
      }
    }

    const res = await api.put(`/recitations/${id}`, data);
    return res.data.data;
  },

  deleteRecitation: async (id: string): Promise<RecitationRecord> => {
    if (!navigator.onLine) {
      // If it's an offline-created record, just remove it from pending list
      if (id.startsWith('offline_')) {
        const pending = getPendingRecitations();
        const filtered = pending.filter(r => r._id !== id);
        savePendingRecitations(filtered);
        return { _id: id } as RecitationRecord;
      } else {
        // If it's an online record, add it to pending_deletes list
        const pendingDeletes = getPendingDeletes();
        pendingDeletes.push(id);
        savePendingDeletes(pendingDeletes);
        return { _id: id } as RecitationRecord;
      }
    }

    const res = await api.delete(`/recitations/${id}`);
    return res.data.data;
  },

  exportRecitations: async (): Promise<RecitationRecord[]> => {
    if (!navigator.onLine) {
      return [...getPendingRecitations(), ...getCachedRecitations()];
    }
    const res = await api.get('/recitations/export');
    return res.data.data;
  },

  importRecitations: async (data: any[]): Promise<any> => {
    if (!navigator.onLine) {
      // Offline: Merge imported data into cache
      const cached = getCachedRecitations();
      const merged = [...data, ...cached];
      saveCachedRecitations(merged);
      return { count: data.length };
    }
    const res = await api.post('/recitations/import', { data });
    return res.data.data;
  },

  // Synchronize local data to server when connection restored
  syncOfflineData: async (): Promise<number> => {
    if (!navigator.onLine) return 0;
    
    const pending = getPendingRecitations();
    const deletes = getPendingDeletes();
    let syncCount = 0;

    // 1. Process deletes first
    if (deletes.length > 0) {
      for (const id of deletes) {
        try {
          await api.delete(`/recitations/${id}`);
          syncCount++;
        } catch (err) {
          console.error(`Failed to sync delete for ${id}`, err);
        }
      }
      savePendingDeletes([]);
    }

    // 2. Process creations
    if (pending.length > 0) {
      // We can format the records for insertion
      const formatted = pending.map(r => ({
        date: r.date,
        surahNumber: r.surahNumber,
        type: r.type,
        fromAyah: r.fromAyah,
        toAyah: r.toAyah,
        notes: r.notes
      }));

      try {
        await api.post('/recitations/import', { data: formatted });
        syncCount += pending.length;
        savePendingRecitations([]);
      } catch (err) {
        console.error('Failed to sync offline creations', err);
      }
    }

    return syncCount;
  }
};
export const getPendingCount = (): number => {
  return getPendingRecitations().length + getPendingDeletes().length;
};
