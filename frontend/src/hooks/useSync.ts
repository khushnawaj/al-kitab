import { useEffect, useState } from 'react';
import { recitationApi, getPendingCount } from '../services/recitations.js';
import { goalApi } from '../services/goals.js';
import { counterApi, getPendingCountersCount } from '../services/counters.js';
import toast from 'react-hot-toast';

export const useSync = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  
  const getTotalPending = () => {
    return getPendingCount() + getPendingCountersCount();
  };

  const [pendingCount, setPendingCount] = useState<number>(getTotalPending());

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const countToSync = getTotalPending();
      
      if (countToSync > 0) {
        const loadingToast = toast.loading('Internet connection restored. Syncing local data...');
        try {
          // Sync recitations
          await recitationApi.syncOfflineData();
          // Sync goals
          await goalApi.syncOfflineGoals();
          // Sync counters
          await counterApi.syncOfflineCounters();
          
          toast.dismiss(loadingToast);
          toast.success(`Connection restored. Synced all offline data successfully!`);
        } catch (err) {
          toast.dismiss(loadingToast);
          toast.error('Sync failed. Will retry later.');
        } finally {
          setPendingCount(getTotalPending());
        }
      } else {
        toast.success('You are back online.');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Changes will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set up a periodic check for pending items
    const interval = setInterval(() => {
      setPendingCount(getTotalPending());
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingCount };
};
