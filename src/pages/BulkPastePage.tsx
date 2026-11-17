import { useMemo, useState, type ClipboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ClipboardPaste, ListPlus, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PlatformBadge } from '../components/links/PlatformBadge';
import { PLATFORM_LIST } from '../config/platforms';
import type { CreateLinkInput, PlatformCategory } from '../types/link';
import { extractLinksFromText, formatUrlsPerLine } from '../utils/linkParser';

interface BulkPastePageProps {
  existingNormalizedSet: Set<string>;
  onSaveBulk: (inputs: CreateLinkInput[]) => Promise<number>;
}

export function BulkPastePage({ existingNormalizedSet, onSaveBulk }: BulkPastePageProps) {
  const [rawText, setRawText] = useState('');
  const [overrideCategory, setOverrideCategory] = useState<PlatformCategory | 'auto'>('auto');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [excludedUrls, setExcludedUrls] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const parseResult = useMemo(() => {
    return extractLinksFromText(
      rawText,
      overrideCategory === 'auto' ? undefined : overrideCategory
    );
  }, [rawText, overrideCategory]);

  const previewItems = useMemo(() => {
    return parseResult.candidates.map((item) => ({
      ...item,
      alreadyExists: existingNormalizedSet.has(item.normalizedUrl),
      excluded: excludedUrls.has(item.normalizedUrl),
    }));
  }, [parseResult.candidates, existingNormalizedSet, excludedUrls]);

  const toSave = useMemo(() => {
    return previewItems.filter(
      (item) => !item.excluded && (!skipDuplicates || !item.alreadyExists)
    );
  }, [previewItems, skipDuplicates]);

  const handlePasteFromClipboard = async () => {
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
      toast.error('Clipboard permission denied — paste manually with Ctrl+V');
    }
  };

  const handleTextareaPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;
    const formatted = formatUrlsPerLine(pasted);
    if (formatted !== pasted) {
      e.preventDefault();
      setRawText((prev) => (prev ? `${prev.trimEnd()}\n${formatted}` : formatted));
      setExcludedUrls(new Set());
    }
  };

  const handleToggleExclude = (normalizedUrl: string) => {
    setExcludedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(normalizedUrl)) next.delete(normalizedUrl);
      else next.add(normalizedUrl);
      return next;
    });
  };

  const handleSave = async () => {
    if (toSave.length === 0) return;
    setSaving(true);
    try {
      const count = await onSaveBulk(
        toSave.map((item) => ({
          url: item.url,
          normalizedUrl: item.normalizedUrl,
          category: item.category,
          ...(item.title ? { title: item.title } : {}),
        }))
      );
      toast.success(`Saved ${count} link${count === 1 ? '' : 's'} to LinkVault`);
      setRawText('');
      setExcludedUrls(new Set());
      navigate('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save links');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-content sm:text-2xl">
            Bulk Paste Links
          </h1>
          <p className="text-sm text-content-secondary">
            Paste messages, notes, or lists of URLs — LinkVault extracts, cleans tracking params,
            and categorizes every link automatically.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePasteFromClipboard}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3.5 py-2 text-xs font-semibold text-content shadow-soft transition-colors hover:border-border-strong hover:bg-surface-muted"
        >
          <ClipboardPaste className="h-4 w-4 text-accent" />
          Paste Clipboard
        </button>
      </div>

      {/* Input Area */}
      <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-soft">
        <textarea
          rows={7}
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            setExcludedUrls(new Set());
          }}
          onPaste={handleTextareaPaste}
          placeholder={`Paste one or more URLs or chat messages here...\n\nExample:\nhttps://youtube.com/watch?v=abc123\nhttps://x.com/user/status/123456\nhttps://www.instagram.com/reel/xyz/`}
          className="w-full resize-y rounded-xl border border-border bg-surface p-3.5 font-mono text-xs leading-relaxed text-content placeholder:text-content-muted focus:border-accent focus:outline-none"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-medium text-content-secondary">
              <span>Category:</span>
              <select
                value={overrideCategory}
                onChange={(e) =>
                  setOverrideCategory(e.target.value as PlatformCategory | 'auto')
                }
                className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-content focus:border-accent focus:outline-none"
              >
                <option value="auto">Auto-detect per URL</option>
                {PLATFORM_LIST.map((p) => (
                  <option key={p.id} value={p.id}>
                    Force {p.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-content-secondary">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong text-accent focus:ring-accent"
              />
              Skip links already in vault
            </label>
          </div>

          {rawText && (
            <button
              type="button"
              onClick={() => {
                setRawText('');
                setExcludedUrls(new Set());
              }}
              className="text-xs font-medium text-content-muted hover:text-content"
            >
              Clear input
            </button>
          )}
        </div>
      </div>

      {/* Live Preview */}
      {previewItems.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-border bg-surface-elevated p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold text-content">
                Detected {previewItems.length} unique URL{previewItems.length === 1 ? '' : 's'}
              </h2>
              {parseResult.duplicateInInputCount > 0 && (
                <span className="rounded-md bg-surface-muted px-2 py-0.5 text-[11px] text-content-secondary">
                  {parseResult.duplicateInInputCount} duplicate
                  {parseResult.duplicateInInputCount === 1 ? '' : 's'} merged
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || toSave.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ListPlus className="h-4 w-4" />
              {saving
                ? 'Saving...'
                : `Save ${toSave.length} Link${toSave.length === 1 ? '' : 's'}`}
            </button>
          </div>

          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {previewItems.map((item) => {
              const skipped = item.excluded || (skipDuplicates && item.alreadyExists);
              return (
                <div
                  key={item.normalizedUrl}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs ${
                    skipped
                      ? 'border-border bg-surface/50 opacity-55'
                      : 'border-border bg-surface'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <PlatformBadge category={item.category} />
                    <span className="truncate font-mono text-content">{item.url}</span>
                    {item.alreadyExists && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        In vault
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleExclude(item.normalizedUrl)}
                    title={item.excluded ? 'Include link' : 'Exclude link'}
                    className="rounded-lg p-1.5 text-content-muted hover:bg-surface-muted hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

