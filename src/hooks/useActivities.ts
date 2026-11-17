import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { clearActivities, subscribeToActivities } from '../services/firestoreService';
import type { ActivityItem } from '../types/activity';
import { auth } from '../config/firebase';
import { LOCAL_USER_ID } from './useAuth';
import { LOCAL_ACTIVITIES_KEY, LOCAL_DATA_EVENT } from './useLinks';

function readLocalActivities(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<
      Omit<ActivityItem, 'createdAt'> & { createdAt: string }
    >;
    return parsed.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }));
  } catch {
    return [];
  }
}

export function useActivities(userId: string | undefined) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLocalMode = userId === LOCAL_USER_ID;

  useEffect(() => {
    if (!userId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    if (isLocalMode) {
      setActivities(readLocalActivities());
      setLoading(false);
      const onLocalUpdate = () => setActivities(readLocalActivities());
      window.addEventListener(LOCAL_DATA_EVENT, onLocalUpdate);
      return () => window.removeEventListener(LOCAL_DATA_EVENT, onLocalUpdate);
    }

    if (!auth?.currentUser) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToActivities(
      userId,
      (items) => {
        setActivities(items);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, isLocalMode]);

  const clearHistory = useCallback(async () => {
    if (!userId || activities.length === 0) return;
    if (isLocalMode) {
      try {
        localStorage.removeItem(LOCAL_ACTIVITIES_KEY);
      } catch {
        // ignore
      }
      setActivities([]);
      toast.success('Activity history cleared');
      return;
    }
    await clearActivities(userId, activities);
    toast.success('Activity history cleared');
  }, [userId, activities, isLocalMode]);

  return {
    activities,
    loading,
    error,
    clearHistory,
  };
}
