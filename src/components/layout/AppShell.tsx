import { useMemo, useState, type ClipboardEvent, type FormEvent, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { AlertTriangle, ClipboardPaste, ListPlus, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { PLATFORM_LIST } from '../../config/platforms';
import type { CreateLinkInput, PlatformCategory } from '../../types/link';
import { extractLinksFromText, formatUrlsPerLine } from '../../utils/linkParser';
import { PwaInstallBanner } from '../common/PwaInstallBanner';
import { PlatformBadge } from '../links/PlatformBadge';
import { MobileBottomNav } from './MobileBottomNav';
import { SidebarNav } from './SidebarNav';
import { TopSearchBar } from './TopSearchBar';

interface AppShellProps {
  user: User;
  categoryCounts: Record<PlatformCategory, number>;
  totalCount: number;
  existingNormalizedSet: Set<string>;
  isOnline: boolean;
  fromCache: boolean;
  hasPendingWrites: boolean;
  syncError?: string | null;
  onDismissSyncError?: () => void;
  canInstallPwa: boolean;
  pwaDismissed: boolean;
  onInstallPwa: () => void;
  onDismissPwa: () => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
  onCreateBulkLinks: (inputs: CreateLinkInput[]) => Promise<number>;
  children: ReactNode;
}

export function AppShell({
  user,
  categoryCounts,
  totalCount,
  existingNormalizedSet,
  isOnline,
  fromCache,
  hasPendingWrites,
  syncError,
  onDismissSyncError,
  canInstallPwa,
  pwaDismissed,
  onInstallPwa,
  onDismissPwa,
  onToggleTheme,
  onSignOut,
  onCreateBulkLinks,
  children,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);

  // Unified Paste Modal state (handles 1 or many links seamlessly)
  const [rawText, setRawText] = useState('');
  const [overrideCategory, setOverrideCategory] = useState<PlatformCategory | 'auto'>('auto');
  const [submitting, setSubmitting] = useState(false);

  const parsed = useMemo(() => {
    return extractLinksFromText(
      rawText,
      overrideCategory === 'auto' ? undefined : overrideCategory
    );
  }, [rawText, overrideCategory]);

  const newLinksToSave = useMemo(() => {
    return parsed.candidates.filter((c) => !existingNormalizedSet.has(c.normalizedUrl));
  }, [parsed.candidates, existingNormalizedSet]);

  const resetPasteModal = () => {
    setRawText('');
    setOverrideCategory('auto');
    setPasteModalOpen(false);
  };

  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const formatted = formatUrlsPerLine(text);
        setRawText((prev) => (prev ? `${prev.trimEnd()}\n${formatted}` : formatted));
        toast.success('Pasted from clipboard');
      } else {
        toast.info('Clipboard is empty');
      }
    } catch {
      toast.error('Paste manually with Ctrl+V');
    }
  };

  const handleTextareaPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;
    const formatted = formatUrlsPerLine(pasted);
    if (formatted !== pasted) {
      e.preventDefault();
      setRawText((prev) => (prev ? `${prev.trimEnd()}\n${formatted}` : formatted));
    }
  };

  const handlePasteSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (parsed.candidates.length === 0) {
      toast.error('Please paste at least one valid URL');
      return;
    }
    if (newLinksToSave.length === 0) {
      toast.info('All pasted links are already in your vault');
      return;
    }

    setSubmitting(true);
    try {
      const count = await onCreateBulkLinks(
        newLinksToSave.map((item) => ({
          url: item.url,
          normalizedUrl: item.normalizedUrl,
          category: item.category,
        }))
      );
      toast.success(`Saved ${count} link${count === 1 ? '' : 's'} to LinkVault`);
      resetPasteModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save links');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface text-content">
      <SidebarNav
        user={user}
        categoryCounts={categoryCounts}
        totalCount={totalCount}
        onSignOut={onSignOut}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopSearchBar
          isOnline={isOnline}
          fromCache={fromCache}
          hasPendingWrites={hasPendingWrites}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenQuickAdd={() => setPasteModalOpen(true)}
          onToggleTheme={onToggleTheme}
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-3.5 pb-24 pt-4 sm:px-5 lg:px-8 lg:pb-10 lg:pt-6">
          {syncError && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-700 dark:text-red-300">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="font-semibold">Sync / Authentication Error</p>
                  <p className="mt-0.5 leading-relaxed opacity-90">{syncError}</p>
                </div>
              </div>
              {onDismissSyncError && (
                <button
                  type="button"
                  onClick={onDismissSyncError}
                  aria-label="Dismiss error"
                  className="rounded-lg p-1 text-red-500 hover:bg-red-500/10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          <PwaInstallBanner
            visible={canInstallPwa && !pwaDismissed}
            onInstall={onInstallPwa}
            onDismiss={onDismissPwa}
          />
          {children}
        </main>
      </div>

      <MobileBottomNav />

      {/* Unified Paste Links Modal (1 or many links) */}
      <AnimatePresence>
        {pasteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetPasteModal}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="relative z-10 w-full max-w-lg rounded-t-3xl border border-border bg-surface-elevated p-5 shadow-card sm:rounded-2xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <ListPlus className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-content">Paste Links</h2>
                    <p className="text-[11px] text-content-secondary">
                      Paste 1 link or multiple links at once — auto-categorized
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetPasteModal}
                  aria-label="Close modal"
                  className="rounded-lg p-1.5 text-content-muted hover:bg-surface-muted hover:text-content"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handlePasteSubmit} className="space-y-3.5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-content-secondary">
                      URL(s) or Message Text
                    </label>
                    <button
                      type="button"
                      onClick={handleClipboardPaste}
                      className="inline-flex items-center gap-1 rounded-lg bg-surface-muted px-2 py-1 text-[11px] font-semibold text-accent hover:bg-accent-soft"
                    >
                      <ClipboardPaste className="h-3 w-3" />
                      Paste Clipboard
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    autoFocus
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    onPaste={handleTextareaPaste}
                    placeholder={`Paste 1 or many links here...\nhttps://x.com/...\nhttps://youtube.com/watch?v=...\nhttps://t.me/...`}
                    className="w-full resize-y rounded-xl border border-border bg-surface p-3 font-mono text-xs leading-relaxed text-content placeholder:text-content-muted focus:border-accent focus:outline-none"
                    required
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <select
                    value={overrideCategory}
                    onChange={(e) =>
                      setOverrideCategory(e.target.value as PlatformCategory | 'auto')
                    }
                    className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-medium text-content focus:border-accent focus:outline-none"
                  >
                    <option value="auto">Auto-detect Platform</option>
                    {PLATFORM_LIST.map((p) => (
                      <option key={p.id} value={p.id}>
                        Force {p.label}
                      </option>
                    ))}
                  </select>

                  {parsed.candidates.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
                      <Sparkles className="h-3.5 w-3.5" />
                      {newLinksToSave.length} new / {parsed.candidates.length} detected
                    </span>
                  )}
                </div>

                {parsed.candidates.length > 0 && (
                  <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-surface p-2">
                    {parsed.candidates.slice(0, 12).map((item) => {
                      const exists = existingNormalizedSet.has(item.normalizedUrl);
                      return (
                        <div
                          key={item.normalizedUrl}
                          className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-[11px] ${
                            exists ? 'opacity-50' : ''
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <PlatformBadge category={item.category} compact />
                            <span className="truncate font-mono text-content">{item.url}</span>
                          </div>
                          {exists && (
                            <span className="shrink-0 text-[10px] font-semibold text-emerald-500">
                              Saved
                            </span>
                          )}
                        </div>
                      );
                    })}
                    {parsed.candidates.length > 12 && (
                      <p className="text-center text-[11px] text-content-muted">
                        +{parsed.candidates.length - 12} more links
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetPasteModal}
                    className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-content-secondary hover:bg-surface-muted hover:text-content"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || newLinksToSave.length === 0}
                    className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                  >
                    {submitting
                      ? 'Saving...'
                      : `Save ${newLinksToSave.length || ''} Link${newLinksToSave.length === 1 ? '' : 's'}`}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
