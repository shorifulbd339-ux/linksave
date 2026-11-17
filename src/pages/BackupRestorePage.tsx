import { useRef, useState, type ChangeEvent } from 'react';
import { CheckCircle2, Download, FileJson, FileSpreadsheet, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PlatformBadge } from '../components/links/PlatformBadge';
import { LOCAL_USER_ID } from '../hooks/useAuth';
import { appendLocalActivity } from '../hooks/useLinks';
import { logActivity } from '../services/firestoreService';
import type { CreateLinkInput, LinkItem } from '../types/link';
import {
  exportLinksToCsv,
  exportLinksToJson,
  parseImportedBackup,
  triggerFileDownload,
} from '../utils/exportImport';

interface BackupRestorePageProps {
  userId: string;
  links: LinkItem[];
  existingNormalizedSet: Set<string>;
  onImportLinks: (
    inputs: CreateLinkInput[],
    actionType?: 'BULK_ADDED' | 'IMPORTED'
  ) => Promise<number>;
}

export function BackupRestorePage({
  userId,
  links,
  existingNormalizedSet,
  onImportLinks,
}: BackupRestorePageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importCandidates, setImportCandidates] = useState<CreateLinkInput[]>([]);
  const [importFilename, setImportFilename] = useState<string>('');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);

  const handleExportJson = async () => {
    const content = exportLinksToJson(links);
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerFileDownload(content, `linkvault-backup-${dateStamp}.json`, 'application/json');
    toast.success(`Exported ${links.length} links as JSON`);
    if (userId === LOCAL_USER_ID) {
      appendLocalActivity({
        action: 'EXPORTED',
        summary: `Exported ${links.length} links to JSON`,
        count: links.length,
      });
    } else {
      logActivity(userId, {
        action: 'EXPORTED',
        summary: `Exported ${links.length} links to JSON`,
        count: links.length,
      }).catch(() => {});
    }
  };

  const handleExportCsv = async () => {
    const content = exportLinksToCsv(links);
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerFileDownload(content, `linkvault-backup-${dateStamp}.csv`, 'text/csv;charset=utf-8');
    toast.success(`Exported ${links.length} links as CSV`);
    if (userId === LOCAL_USER_ID) {
      appendLocalActivity({
        action: 'EXPORTED',
        summary: `Exported ${links.length} links to CSV`,
        count: links.length,
      });
    } else {
      logActivity(userId, {
        action: 'EXPORTED',
        summary: `Exported ${links.length} links to CSV`,
        count: links.length,
      }).catch(() => {});
    }
  };

  const handleFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImportedBackup(text, file.name);
      if (parsed.length === 0) {
        toast.error('No valid links found in that file');
        return;
      }
      setImportCandidates(parsed);
      setImportFilename(file.name);
      toast.success(`Found ${parsed.length} link${parsed.length === 1 ? '' : 's'} in ${file.name}`);
    } catch {
      toast.error('Failed to read backup file');
    } finally {
      e.target.value = '';
    }
  };

  const readyToImport = importCandidates.filter((item) => {
    if (!skipDuplicates) return true;
    const norm = item.normalizedUrl ?? item.url;
    return !existingNormalizedSet.has(norm);
  });

  const handleConfirmImport = async () => {
    if (readyToImport.length === 0) return;
    setImporting(true);
    try {
      const count = await onImportLinks(readyToImport, 'IMPORTED');
      toast.success(`Imported ${count} link${count === 1 ? '' : 's'}`);
      setImportCandidates([]);
      setImportFilename('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to import backup');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-content sm:text-2xl">
          Backup & Restore
        </h1>
        <p className="text-sm text-content-secondary">
          Export your entire LinkVault library or restore links from JSON, CSV, or plain-text files.
        </p>
      </div>

      {/* Export Section */}
      <section className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <Download className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-content">Export Vault</h2>
        </div>
        <p className="mt-1 text-xs text-content-secondary">
          Download all {links.length} saved link{links.length === 1 ? '' : 's'} with categories,
          titles, and timestamps.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            disabled={links.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileJson className="h-4 w-4" />
            Export JSON Backup
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={links.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-content transition-colors hover:border-border-strong hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            Export CSV Spreadsheet
          </button>
        </div>
      </section>

      {/* Import Section */}
      <section className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-content">Restore / Import Links</h2>
        </div>
        <p className="mt-1 text-xs text-content-secondary">
          Supports LinkVault JSON backups, CSV files, or plain-text files containing URLs.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv,.txt,application/json,text/csv,text/plain"
          onChange={handleFileSelected}
          className="hidden"
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border-strong bg-surface px-4 py-2.5 text-xs font-semibold text-content transition-colors hover:border-accent hover:text-accent"
          >
            <Upload className="h-4 w-4" />
            Choose Backup File (.json, .csv, .txt)
          </button>

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

        {importCandidates.length > 0 && (
          <div className="mt-5 space-y-3 rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-content">{importFilename}</p>
                <p className="text-[11px] text-content-secondary">
                  {readyToImport.length} new link{readyToImport.length === 1 ? '' : 's'} ready to
                  import ({importCandidates.length} total in file)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImportCandidates([]);
                    setImportFilename('');
                  }}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-content-secondary hover:text-content"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importing || readyToImport.length === 0}
                  className="rounded-xl bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {importing
                    ? 'Importing...'
                    : `Import ${readyToImport.length} Link${readyToImport.length === 1 ? '' : 's'}`}
                </button>
              </div>
            </div>

            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {importCandidates.slice(0, 100).map((item, idx) => {
                const norm = item.normalizedUrl ?? item.url;
                const exists = existingNormalizedSet.has(norm);
                return (
                  <div
                    key={`${norm}-${idx}`}
                    className={`flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-elevated px-2.5 py-2 text-xs ${
                      skipDuplicates && exists ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <PlatformBadge category={item.category ?? 'other'} />
                      <span className="truncate font-mono text-content">{item.url}</span>
                    </div>
                    {exists && (
                      <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        In vault
                      </span>
                    )}
                  </div>
                );
              })}
              {importCandidates.length > 100 && (
                <p className="pt-1 text-center text-[11px] text-content-muted">
                  Showing first 100 of {importCandidates.length} links...
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

