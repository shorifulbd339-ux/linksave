import { useMemo, useState } from 'react';
import {
  Clock,
  Copy,
  Download,
  ListPlus,
  Plus,
  Trash2,
  Upload,
  Eraser,
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';
import { DeleteConfirmModal } from '../components/links/DeleteConfirmModal';
import { PlatformBadge } from '../components/links/PlatformBadge';
import type { ActivityAction, ActivityItem } from '../types/activity';
import { formatDateTime, formatRelativeTime } from '../utils/dateFilters';

interface HistoryPageProps {
  activities: ActivityItem[];
  loading: boolean;
  onClearHistory: () => Promise<void>;
}

const ACTION_META: Record<
  ActivityAction,
  { label: string; icon: typeof Plus; badgeClass: string }
> = {
  ADDED: {
    label: 'Added',
    icon: Plus,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  BULK_ADDED: {
    label: 'Bulk Added',
    icon: ListPlus,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  COPIED: {
    label: 'Copied',
    icon: Copy,
    badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  DELETED: {
    label: 'Deleted',
    icon: Trash2,
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  BULK_DELETED: {
    label: 'Bulk Deleted',
    icon: Trash2,
    badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  IMPORTED: {
    label: 'Imported',
    icon: Upload,
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
  EXPORTED: {
    label: 'Exported',
    icon: Download,
    badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  CLEARED: {
    label: 'Cleared',
    icon: Eraser,
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
};

export function HistoryPage({ activities, loading, onClearHistory }: HistoryPageProps) {
  const [filterAction, setFilterAction] = useState<ActivityAction | 'ALL'>('ALL');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const filtered = useMemo(() => {
    if (filterAction === 'ALL') return activities;
    return activities.filter((a) => a.action === filterAction);
  }, [activities, filterAction]);

  const handleConfirmClear = async () => {
    setClearing(true);
    try {
      await onClearHistory();
      setConfirmOpen(false);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-content sm:text-2xl">
            Activity History
          </h1>
          <p className="text-sm text-content-secondary">
            Real-time audit log of additions, copies, imports, exports, and deletions.
          </p>
        </div>

        {activities.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear History
          </button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilterAction('ALL')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
            filterAction === 'ALL'
              ? 'bg-accent text-white'
              : 'border border-border bg-surface-elevated text-content-secondary hover:text-content'
          }`}
        >
          All ({activities.length})
        </button>
        {(Object.keys(ACTION_META) as ActivityAction[]).map((action) => (
          <button
            key={action}
            type="button"
            onClick={() => setFilterAction(action)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterAction === action
                ? 'bg-accent text-white'
                : 'border border-border bg-surface-elevated text-content-secondary hover:text-content'
            }`}
          >
            {ACTION_META[action].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-16 animate-pulse rounded-2xl border border-border bg-surface-elevated"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No activity recorded yet"
          description="Your link additions, copies, imports, and deletions will appear here in real time."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const meta = ACTION_META[item.action] ?? ACTION_META.ADDED;
            const Icon = meta.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-elevated p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.badgeClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-content">{meta.label}</span>
                      {item.category && <PlatformBadge category={item.category} />}
                      <span className="rounded-md bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-content-secondary">
                        {item.count}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-content-secondary">{item.summary}</p>
                  </div>
                </div>

                <div className="pl-12 text-left sm:pl-0 sm:text-right">
                  <span
                    title={formatDateTime(item.createdAt)}
                    className="text-xs text-content-muted"
                  >
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DeleteConfirmModal
        open={confirmOpen}
        title="Clear all activity history?"
        description="This permanently deletes your activity log entries from Cloud Firestore. Your saved links will not be affected."
        confirmLabel="Clear History"
        loading={clearing}
        onConfirm={handleConfirmClear}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

