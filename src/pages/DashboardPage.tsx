import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { isToday } from 'date-fns';
import { Bookmark, Layers, ListPlus, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { CategoryDistributionChart } from '../components/common/CategoryDistributionChart';
import { DateFilterBar } from '../components/common/DateFilterBar';
import { EmptyState } from '../components/common/EmptyState';
import { StatCard } from '../components/common/StatCard';
import { BulkActionToolbar } from '../components/links/BulkActionToolbar';
import { DeleteConfirmModal } from '../components/links/DeleteConfirmModal';
import { EditLinkModal } from '../components/links/EditLinkModal';
import { LinkTable } from '../components/links/LinkTable';
import type { DateFilterState, SortOption } from '../types/filter';
import type { CreateLinkInput, LinkItem, PlatformCategory, UpdateLinkInput } from '../types/link';
import { matchesDateFilter } from '../utils/dateFilters';
import { buildSampleLinks } from '../utils/sampleData';

interface DashboardPageProps {
  links: LinkItem[];
  loading: boolean;
  categoryCounts: Record<PlatformCategory, number>;
  onCopySingle: (link: LinkItem) => void;
  onCopyBulk: (links: LinkItem[]) => void;
  onEditLink: (linkId: string, input: UpdateLinkInput) => Promise<void>;
  onDeleteLink: (link: LinkItem) => Promise<void>;
  onDeleteBulk: (links: LinkItem[]) => Promise<number>;
  onCreateBulk: (inputs: CreateLinkInput[]) => Promise<number>;
}

export function DashboardPage({
  links,
  loading,
  categoryCounts,
  onCopySingle,
  onCopyBulk,
  onEditLink,
  onDeleteLink,
  onDeleteBulk,
  onCreateBulk,
}: DashboardPageProps) {
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'all',
    startDate: '',
    endDate: '',
  });
  const [sort, setSort] = useState<SortOption>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<LinkItem | 'bulk' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadingSamples, setLoadingSamples] = useState(false);

  const savedTodayCount = useMemo(
    () => links.filter((item) => isToday(item.createdAt)).length,
    [links]
  );

  const activePlatformsCount = useMemo(
    () => Object.values(categoryCounts).filter((c) => c > 0).length,
    [categoryCounts]
  );

  const topPlatform = useMemo(() => {
    let best: PlatformCategory | null = null;
    let max = 0;
    for (const [cat, count] of Object.entries(categoryCounts)) {
      if (count > max) {
        max = count;
        best = cat as PlatformCategory;
      }
    }
    return best ? `${best.charAt(0).toUpperCase() + best.slice(1)} (${max})` : 'None yet';
  }, [categoryCounts]);

  const filteredLinks = useMemo(() => {
    const matching = links.filter((link) => matchesDateFilter(link.createdAt, dateFilter));
    return [...matching].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'title':
          return (a.title || a.url).localeCompare(b.title || b.url);
        case 'platform':
          return a.category.localeCompare(b.category);
        case 'newest':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });
  }, [links, dateFilter, sort]);

  const selectedLinks = useMemo(
    () => filteredLinks.filter((l) => selectedIds.has(l.id)),
    [filteredLinks, selectedIds]
  );

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    const allSelected =
      filteredLinks.length > 0 && filteredLinks.every((l) => selectedIds.has(l.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLinks.map((l) => l.id)));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    setDeleting(true);
    try {
      if (deletingTarget === 'bulk') {
        await onDeleteBulk(selectedLinks);
        setSelectedIds(new Set());
      } else {
        await onDeleteLink(deletingTarget);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(deletingTarget.id);
          return next;
        });
      }
      setDeletingTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleLoadSamples = async () => {
    setLoadingSamples(true);
    try {
      const samples = buildSampleLinks();
      const count = await onCreateBulk(samples);
      toast.success(`Loaded ${count} sample links`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load sample links');
    } finally {
      setLoadingSamples(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-content sm:text-2xl">
            Dashboard
          </h1>
          <p className="text-sm text-content-secondary">
            All your social links synced in real time across Android & Web.
          </p>
        </div>

        <Link
          to="/bulk-paste"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5 py-2 text-xs font-semibold text-content shadow-soft transition-colors hover:border-border-strong hover:bg-surface-muted"
        >
          <ListPlus className="h-4 w-4 text-accent" />
          Bulk Paste Links
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Links"
          value={links.length}
          sublabel="Stored in your vault"
          icon={Bookmark}
        />
        <StatCard
          label="Saved Today"
          value={savedTodayCount}
          sublabel="Added in the last 24h"
          icon={TrendingUp}
          accentClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Active Platforms"
          value={`${activePlatformsCount} / 5`}
          sublabel="Twitter, YT, FB, TG, Other"
          icon={Layers}
          accentClass="bg-sky-500/10 text-sky-600 dark:text-sky-400"
        />
        <StatCard
          label="Top Platform"
          value={topPlatform}
          sublabel="Most saved source"
          icon={Sparkles}
          accentClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Distribution Chart */}
      <CategoryDistributionChart
        counts={categoryCounts}
        total={links.length}
        onCopyCategory={(cat) => {
          const catLinks = links.filter((l) => l.category === cat);
          onCopyBulk(catLinks);
        }}
      />

      {/* Links Feed */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-content">Recent Links</h2>
        </div>

        <DateFilterBar
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          sort={sort}
          onSortChange={setSort}
        />

        {loading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-20 animate-pulse rounded-2xl border border-border bg-surface-elevated"
              />
            ))}
          </div>
        ) : filteredLinks.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={links.length === 0 ? 'Your LinkVault is empty' : 'No links match this date range'}
            description={
              links.length === 0
                ? 'Add a link from the top bar, paste a batch of URLs, or load sample links to explore.'
                : 'Try switching the date filter to All Time to see your saved links.'
            }
            action={
              links.length === 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link
                    to="/bulk-paste"
                    className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover"
                  >
                    Bulk Paste Links
                  </Link>
                  <button
                    type="button"
                    onClick={handleLoadSamples}
                    disabled={loadingSamples}
                    className="rounded-xl border border-border bg-surface-elevated px-4 py-2 text-xs font-semibold text-content hover:bg-surface-muted disabled:opacity-50"
                  >
                    {loadingSamples ? 'Loading...' : 'Load Sample Links'}
                  </button>
                </div>
              ) : undefined
            }
          />
        ) : (
          <LinkTable
            links={filteredLinks}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onCopyAll={() => onCopyBulk(filteredLinks)}
            onCopy={onCopySingle}
            onEdit={setEditingLink}
            onDelete={(link) => setDeletingTarget(link)}
          />
        )}
      </section>

      <BulkActionToolbar
        selectedCount={selectedLinks.length}
        onCopySelected={() => onCopyBulk(selectedLinks)}
        onDeleteSelected={() => setDeletingTarget('bulk')}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <EditLinkModal
        link={editingLink}
        onClose={() => setEditingLink(null)}
        onSave={onEditLink}
      />

      <DeleteConfirmModal
        open={Boolean(deletingTarget)}
        title={
          deletingTarget === 'bulk'
            ? `Delete ${selectedLinks.length} selected link${selectedLinks.length === 1 ? '' : 's'}?`
            : 'Delete this link?'
        }
        description="This action removes the link from Cloud Firestore and syncs immediately to your Android app."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTarget(null)}
      />
    </div>
  );
}

