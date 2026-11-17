import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PwaInstallBannerProps {
  visible: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export function PwaInstallBanner({ visible, onInstall, onDismiss }: PwaInstallBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/25 bg-accent-soft/70 px-4 py-3 text-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-content">Install LinkVault App</p>
              <p className="text-xs text-content-secondary">
                Add LinkVault to your home screen or desktop for instant offline access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onInstall}
              className="rounded-xl bg-accent px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Install
            </button>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss install banner"
              className="rounded-lg p-1.5 text-content-secondary transition-colors hover:bg-surface-muted hover:text-content"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

