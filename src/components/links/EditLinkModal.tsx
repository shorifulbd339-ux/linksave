import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { PLATFORM_LIST } from '../../config/platforms';
import type { LinkItem, PlatformCategory, UpdateLinkInput } from '../../types/link';
import { isValidHttpUrl, normalizeUrl, ensureProtocol } from '../../utils/linkParser';
import { detectPlatform } from '../../utils/platformDetector';

interface EditLinkModalProps {
  link: LinkItem | null;
  onClose: () => void;
  onSave: (linkId: string, input: UpdateLinkInput) => Promise<void>;
}

export function EditLinkModal({ link, onClose, onSave }: EditLinkModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PlatformCategory>('other');
  const [manualCategory, setManualCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (link) {
      setUrl(link.url);
      setTitle(link.title ?? '');
      setCategory(link.category);
      setManualCategory(false);
      setError(null);
    }
  }, [link]);

  const handleUrlChange = (nextUrl: string) => {
    setUrl(nextUrl);
    if (!manualCategory && nextUrl.trim()) {
      setCategory(detectPlatform(nextUrl));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!link) return;
    if (!isValidHttpUrl(url)) {
      setError('Please enter a valid http:// or https:// URL.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const cleanUrl = ensureProtocol(url).slice(0, 2048);
      await onSave(link.id, {
        url: cleanUrl,
        normalizedUrl: normalizeUrl(cleanUrl),
        category,
        title: title.trim().slice(0, 120) || undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update link.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {link && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-5 shadow-card"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-content">Edit Link</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-content-muted hover:bg-surface-muted hover:text-content"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-content-secondary">
                  URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 font-mono text-xs text-content focus:border-accent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-content-secondary">
                  Title / Note (optional)
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., React design system video"
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-content focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-content-secondary">
                  Platform Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setManualCategory(true);
                    setCategory(e.target.value as PlatformCategory);
                  }}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-content focus:border-accent focus:outline-none"
                >
                  {PLATFORM_LIST.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-500">{error}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-content-secondary hover:bg-surface-muted hover:text-content"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

