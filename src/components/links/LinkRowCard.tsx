import { Check, CloudUpload, Copy, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LinkItem } from '../../types/link';
import { formatRelativeTime, formatDateTime } from '../../utils/dateFilters';
import { extractDisplayHost } from '../../utils/platformDetector';
import { PlatformBadge } from './PlatformBadge';

interface LinkRowCardProps {
  link: LinkItem;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onCopy: (link: LinkItem) => void;
  onEdit: (link: LinkItem) => void;
  onDelete: (link: LinkItem) => void;
}

export function LinkRowCard({
  link,
  selected,
  onToggleSelect,
  onCopy,
  onEdit,
  onDelete,
}: LinkRowCardProps) {
  const host = extractDisplayHost(link.url);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.16 }}
      className={`group flex flex-col gap-3 rounded-2xl border p-3.5 transition-all sm:flex-row sm:items-center sm:justify-between ${
        selected
          ? 'border-accent bg-accent-soft/50 ring-2 ring-accent/20 shadow-sm'
          : 'border-border bg-surface-elevated hover:border-border-strong hover:shadow-soft'
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={selected}
          aria-label={`Select ${link.title || link.url}`}
          onClick={() => onToggleSelect(link.id)}
          className={`mt-0.5 flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-lg border-2 transition-all active:scale-90 ${
            selected
              ? 'border-accent bg-accent text-white shadow-sm shadow-accent/30'
              : 'border-border-strong bg-surface hover:border-accent/70 hover:bg-accent/5'
          }`}
        >
          <Check
            className={`h-3.5 w-3.5 stroke-[3] transition-transform duration-150 ${
              selected ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge category={link.category} />
            {link.sampleData && (
              <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Sample
              </span>
            )}
            {link.pendingSync && (
              <span
                title="Pending cloud sync"
                className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400"
              >
                <CloudUpload className="h-3 w-3" />
                Syncing
              </span>
            )}
            <span
              title={formatDateTime(link.createdAt)}
              className="text-xs text-content-muted"
            >
              {formatRelativeTime(link.createdAt)}
            </span>
          </div>

          {link.title && (
            <p className="mt-1.5 truncate text-sm font-semibold text-content">{link.title}</p>
          )}

          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block truncate font-mono text-xs text-content-secondary transition-colors hover:text-accent"
            title={link.url}
          >
            {link.url}
          </a>
          <p className="mt-0.5 text-[11px] text-content-muted">{host}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1.5 pl-8 sm:pl-0">
        <button
          type="button"
          onClick={() => onCopy(link)}
          title="Copy URL"
          aria-label="Copy URL"
          className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-border bg-surface px-2.5 text-xs font-medium text-content-secondary transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent active:scale-95"
        >
          <Copy className="h-3.5 w-3.5" />
          <span className="sm:hidden">Copy</span>
        </button>

        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in new tab"
          aria-label="Open link in new tab"
          className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-border bg-surface text-content-secondary transition-colors hover:border-border-strong hover:text-content active:scale-95"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>

        <button
          type="button"
          onClick={() => onEdit(link)}
          title="Edit link"
          aria-label="Edit link"
          className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-border bg-surface text-content-secondary transition-colors hover:border-border-strong hover:text-content active:scale-95"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(link)}
          title="Delete link"
          aria-label="Delete link"
          className="inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-border bg-surface text-content-secondary transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500 active:scale-95"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
