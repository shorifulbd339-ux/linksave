import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { DateFilterBar } from '../components/common/DateFilterBar';
import { EmptyState } from '../components/common/EmptyState';
import { BulkActionToolbar } from '../components/links/BulkActionToolbar';
import { DeleteConfirmModal } from '../components/links/DeleteConfirmModal';
import { EditLinkModal } from '../components/links/EditLinkModal';
import { LinkTable } from '../components/links/LinkTable';
import { PLATFORM_LIST, PLATFORMS } from '../config/platforms';
import type { DateFilterState, SortOption } from '../types/filter';
import type { LinkItem, PlatformCategory, UpdateLinkInput } from '../types/link';
import { matchesDateFilter } from '../utils/dateFilters';

interface SearchResultsPageProps {
  links: LinkItem[];
  onCopySingle: (link: LinkItem) => void;
  onCopyBulk: (links: LinkItem[]) => void;
  onEditLink: (linkId: string, input: UpdateLinkInput) => Promise<void>;
  onDeleteLink: (link: LinkItem) => Promise<void>;
  onDeleteBulk: (links: LinkItem[]) => Promise<number>;
}

export function SearchResultsPage({
  links,
  onCopySingle,
  onCopyBulk,
  onEditLink,
  onDeleteLink,
  onDeleteBulk,
}: SearchResultsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState<PlatformCategory | 'all'>('all');
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

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = links.filter((link) => {
      if (categoryFilter !== 'all' && link.category !== categoryFilter) return false;
      if (!matchesDateFilter(link.createdAt, dateFilter)) return false;
      if (!q) return true;
      const platformLabel = PLATFORMS[link.category]?.label.toLowerCase() ?? '';
      return (
        link.url.toLowerCase().includes(q) ||
        link.normalizedUrl.toLowerCase().includes(q) ||
        (link.title?.toLowerCase().includes(q) ?? false) ||
        platformLabel.includes(q)
      );
    });

    return [...filtered].sort((a, b) => {
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
  }, [links, query, categoryFilter, dateFilter, sort]);

  const selectedLinks = useMemo(
    () => results.filter((l) => selectedIds.has(l.id)),
    [results, selectedIds]
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
    const allSelected = results.length > 0 && results.every((l) => selectedIds.has(l.id));
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(results.map((l) => l.id)));
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-content sm:text-2xl">
          Search Links
        </h1>
        <p className="text-sm text-content-secondary">
          Filter across URLs, titles, platforms, and date ranges.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search by keyword, domain, title, or platform..."
          className="h-11 w-full rounded-2xl border border-border bg-surface-elevated pl-10 pr-10 text-sm text-content shadow-soft placeholder:text-content-muted focus:border-accent focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => handleQueryChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-content-muted hover:text-content"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Platform Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
            categoryFilter === 'all'
              ? 'bg-accent text-white'
              : 'border border-border bg-surface-elevated text-content-secondary hover:text-content'
          }`}
        >
          All Platforms
        </button>
        {PLATFORM_LIST.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setCategoryFilter(p.id)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              categoryFilter === p.id
                ? 'bg-accent text-white'
                : 'border border-border bg-surface-elevated text-content-secondary hover:text-content'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <DateFilterBar
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        sort={sort}
        onSortChange={setSort}
      />

      {results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching links found"
          description="Try broadening your search query, platform filter, or date range."
        />
      ) : (
        <LinkTable
          links={results}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onCopyAll={() => onCopyBulk(results)}
          onCopy={onCopySingle}
          onEdit={setEditingLink}
          onDelete={(link) => setDeletingTarget(link)}
        />
      )}

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

