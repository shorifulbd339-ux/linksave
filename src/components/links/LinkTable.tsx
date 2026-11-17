import { Check, Copy, Minus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import type { LinkItem } from '../../types/link';
import { LinkRowCard } from './LinkRowCard';

interface LinkTableProps {
  links: LinkItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onCopyAll?: () => void;
  onCopy: (link: LinkItem) => void;
  onEdit: (link: LinkItem) => void;
  onDelete: (link: LinkItem) => void;
}

export function LinkTable({
  links,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onCopyAll,
  onCopy,
  onEdit,
  onDelete,
}: LinkTableProps) {
  const allSelected = links.length > 0 && links.every((l) => selectedIds.has(l.id));
  const someSelected = links.some((l) => selectedIds.has(l.id)) && !allSelected;

  return (
    <div className="space-y-2.5">
      {links.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-surface-elevated/80 px-3.5 py-2.5 text-xs">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="inline-flex items-center gap-2.5 font-semibold text-content-secondary transition-colors hover:text-content"
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-lg border-2 transition-all ${
                allSelected || someSelected
                  ? 'border-accent bg-accent text-white shadow-sm shadow-accent/25'
                  : 'border-border-strong bg-surface'
              }`}
            >
              {allSelected ? (
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              ) : someSelected ? (
                <Minus className="h-3.5 w-3.5 stroke-[3]" />
              ) : null}
            </span>
            <span>{allSelected ? 'Deselect all' : `Select all (${links.length})`}</span>
          </button>

          <div className="flex items-center gap-2">
            {onCopyAll && (
              <button
                type="button"
                onClick={onCopyAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-accent/30 bg-accent-soft/70 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent hover:text-white active:scale-95"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy All ({links.length})
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {links.map((link) => (
            <LinkRowCard
              key={link.id}
              link={link}
              selected={selectedIds.has(link.id)}
              onToggleSelect={onToggleSelect}
              onCopy={onCopy}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
