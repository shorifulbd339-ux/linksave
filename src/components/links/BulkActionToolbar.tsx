import { Copy, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface BulkActionToolbarProps {
  selectedCount: number;
  onCopySelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  onCopySelected,
  onDeleteSelected,
  onClearSelection,
}: BulkActionToolbarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="fixed bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-border-strong bg-surface-elevated/95 px-4 py-2.5 shadow-card backdrop-blur-md md:bottom-6"
        >
          <span className="mr-1 rounded-lg bg-accent/15 px-2.5 py-1 text-xs font-bold text-accent">
            {selectedCount} selected
          </span>

          <button
            type="button"
            onClick={onCopySelected}
            className="inline-flex items-center gap-1.5 rounded-xl bg-surface-muted px-3 py-1.5 text-xs font-semibold text-content transition-colors hover:bg-border"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>

          <button
            type="button"
            onClick={onDeleteSelected}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            aria-label="Clear selection"
            className="ml-1 rounded-lg p-1.5 text-content-muted transition-colors hover:bg-surface-muted hover:text-content"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

