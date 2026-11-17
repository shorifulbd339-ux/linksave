import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

interface SyncStatusBadgeProps {
  isOnline: boolean;
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export function SyncStatusBadge({
  isOnline,
  fromCache,
  hasPendingWrites,
}: SyncStatusBadgeProps) {
  if (!isOnline) {
    return (
      <span
        title="Offline — changes are saved locally and will sync when back online"
        className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
      >
        <CloudOff className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Offline</span>
      </span>
    );
  }

  if (hasPendingWrites) {
    return (
      <span
        title="Syncing pending changes to Cloud Firestore"
        className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400"
      >
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        <span className="hidden sm:inline">Syncing</span>
      </span>
    );
  }

  return (
    <span
      title={
        fromCache
          ? 'Loaded from offline cache — connecting to Firestore'
          : 'Synced in real time with Android & Cloud Firestore'
      }
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
    >
      <Cloud className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Synced</span>
    </span>
  );
}

