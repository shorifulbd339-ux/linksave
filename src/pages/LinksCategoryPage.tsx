import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { DateFilterBar } from '../components/common/DateFilterBar';
import { EmptyState } from '../components/common/EmptyState';
import { BulkActionToolbar } from '../components/links/BulkActionToolbar';
import { DeleteConfirmModal } from '../components/links/DeleteConfirmModal';
import { EditLinkModal } from '../components/links/EditLinkModal';
import { LinkTable } from '../components/links/LinkTable';
import { PLATFORMS } from '../config/platforms';
import type { DateFilterState, SortOption } from '../types/filter';
import { PLATFORM_CATEGORIES, type LinkItem, type PlatformCategory, type UpdateLinkInput } from '../types/link';
import { matchesDateFilter } from '../utils/dateFilters';

interface LinksCategoryPageProps {
  links: LinkItem[];
  onCopySingle: (link: LinkItem) => void;
  onCopyBulk: (links: LinkItem[]) => void;
  onEditLink: (linkId: string, input: UpdateLinkInput) => Promise<void>;
  onDeleteLink: (link: LinkItem) => Promise<void>;
  onDeleteBulk: (links: LinkItem[]) => Promise<number>;
}

export function LinksCategoryPage({
  links,
  onCopySingle,
  onCopyBulk,
  onEditLink,
  onDeleteLink,
  onDeleteBulk,
}: LinksCategoryPageProps) {
  const { platform } = useParams<{ platform: string }>();
  const validCategory: PlatformCategory = (PLATFORM_CATEGORIES as readonly string[]).includes(
    platform ?? ''
  )
    ? (platform as PlatformCategory)
    : 'other';

  const meta = PLATFORMS[validCategory];
  const Icon = meta.icon;

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

  const categoryLinks = useMemo(() => {
    const filtered = links.filter(
      (link) =>
        link.category === validCategory && matchesDateFilter(link.createdAt, dateFilter)
    );
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
  }, [links, validCategory, dateFilter, sort]);

  const selectedLinks = useMemo(
    () => categoryLinks.filter((l) => selectedIds.has(l.id)),
    [categoryLinks, selectedIds]
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
      categoryLinks.length > 0 && categoryLinks.every((l) => selectedIds.has(l.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(categoryLinks.map((l) => l.id)));
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            aria-label="Back to dashboard"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-elevated text-content-secondary hover:text-content"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-content">{meta.label}</h1>
            <p className="text-xs text-content-secondary">
              {categoryLinks.length} saved link{categoryLinks.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </div>

      <DateFilterBar
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        sort={sort}
        onSortChange={setSort}
      />

      {categoryLinks.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={`No ${meta.label} links yet`}
          description={`Links from ${meta.label} saved on Android or Web will appear here automatically.`}
        />
      ) : (
        <LinkTable
          links={categoryLinks}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          onCopyAll={() => onCopyBulk(categoryLinks)}
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

