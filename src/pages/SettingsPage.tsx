import { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  CheckCircle2,
  Copy,
  Database,
  Download,
  LogOut,
  Monitor,
  Moon,
  Sparkles,
  Sun,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmModal } from '../components/links/DeleteConfirmModal';
import { FIREBASE_CONFIG, FIRESTORE_DATABASE_ID } from '../config/firebase';
import { LOCAL_USER_ID } from '../hooks/useAuth';
import type { ThemeMode } from '../hooks/useTheme';
import type { CreateLinkInput, LinkItem } from '../types/link';
import { copyTextToClipboard } from '../utils/clipboard';
import { buildSampleLinks } from '../utils/sampleData';

interface SettingsPageProps {
  user: User;
  links: LinkItem[];
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  canInstallPwa: boolean;
  isPwaInstalled: boolean;
  onInstallPwa: () => Promise<boolean>;
  onSignOut: () => void;
  onCreateBulk: (inputs: CreateLinkInput[]) => Promise<number>;
  onDeleteBulk: (
    links: LinkItem[],
    actionType?: 'BULK_DELETED' | 'CLEARED',
    customSummary?: string
  ) => Promise<number>;
}

export function SettingsPage({
  user,
  links,
  theme,
  onThemeChange,
  canInstallPwa,
  isPwaInstalled,
  onInstallPwa,
  onSignOut,
  onCreateBulk,
  onDeleteBulk,
}: SettingsPageProps) {
  const [confirmMode, setConfirmMode] = useState<'sample' | 'all' | null>(null);
  const [processing, setProcessing] = useState(false);

  const sampleLinks = useMemo(() => links.filter((l) => l.sampleData === true), [links]);

  const handleLoadSamples = async () => {
    setProcessing(true);
    try {
      const samples = buildSampleLinks();
      const count = await onCreateBulk(samples);
      toast.success(`Loaded ${count} sample links`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load sample links');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmClear = async () => {
    setProcessing(true);
    try {
      if (confirmMode === 'sample') {
        await onDeleteBulk(
          sampleLinks,
          'CLEARED',
          `Cleared ${sampleLinks.length} sample links`
        );
      } else if (confirmMode === 'all') {
        await onDeleteBulk(links, 'CLEARED', `Cleared all ${links.length} links`);
      }
      setConfirmMode(null);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-content sm:text-2xl">Settings</h1>
        <p className="text-sm text-content-secondary">
          Manage appearance, PWA installation, Firebase sync details, and vault data.
        </p>
      </div>

      {/* Account Card */}
      <section className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
        <h2 className="text-sm font-bold text-content">Account</h2>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? 'User'}
                className="h-12 w-12 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-base font-bold text-white">
                {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-content">
                {user.displayName ?? 'LinkVault User'}
              </p>
              <p className="text-xs text-content-secondary">{user.email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <p className="font-mono text-[11px] text-content-muted">
                  Sync UID: {user.uid}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await copyTextToClipboard(user.uid);
                    if (ok) toast.success('Sync UID copied');
                  }}
                  title="Copy Sync UID"
                  className="rounded p-0.5 text-content-muted hover:bg-surface-muted hover:text-content"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-content transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </section>

      {/* Theme */}
      <section className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
        <h2 className="text-sm font-bold text-content">Appearance</h2>
        <p className="mt-1 text-xs text-content-secondary">
          Choose your preferred color theme for LinkVault.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2.5 sm:max-w-md">
          {(
            [
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = theme === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onThemeChange(item.id)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-border bg-surface text-content-secondary hover:border-border-strong hover:text-content'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* PWA Install */}
      <section className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
        <h2 className="text-sm font-bold text-content">Progressive Web App (PWA)</h2>
        <p className="mt-1 text-xs text-content-secondary">
          Install LinkVault on your desktop or mobile device for standalone offline access.
        </p>

        <div className="mt-4">
          {isPwaInstalled ? (
            <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Installed as Standalone App
            </span>
          ) : canInstallPwa ? (
            <button
              type="button"
              onClick={onInstallPwa}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent-hover"
            >
              <Download className="h-4 w-4" />
              Install LinkVault App
            </button>
          ) : (
            <p className="text-xs text-content-muted">
              Use your browser&apos;s &ldquo;Install App&rdquo; or &ldquo;Add to Home Screen&rdquo;
              menu when available.
            </p>
          )}
        </div>
      </section>

      {/* Firebase Sync Info */}
      <section className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold text-content">Cloud Firestore Sync Diagnostics</h2>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              user.uid === LOCAL_USER_ID
                ? 'bg-zinc-500/10 text-content-secondary'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {user.uid === LOCAL_USER_ID ? 'Local Mode' : 'Cloud Live'}
          </span>
        </div>
        <div className="mt-3 space-y-1.5 rounded-xl bg-surface p-3.5 font-mono text-xs text-content-secondary">
          <p>
            <span className="text-content-muted">Email:</span> {user.email ?? 'N/A'}
          </p>
          <p className="break-all">
            <span className="text-content-muted">Sync UID:</span> {user.uid}
          </p>
          <p>
            <span className="text-content-muted">Project ID:</span> {FIREBASE_CONFIG.projectId}
          </p>
          <p className="break-all">
            <span className="text-content-muted">Database ID:</span> {FIRESTORE_DATABASE_ID}
          </p>
          <p>
            <span className="text-content-muted">Offline Cache:</span> Multi-tab IndexedDB enabled
          </p>
        </div>
      </section>

      {/* Data Management */}
      <section className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
        <h2 className="text-sm font-bold text-content">Vault Data Management</h2>
        <p className="mt-1 text-xs text-content-secondary">
          Load sample links for testing or clear existing data from your vault.
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleLoadSamples}
            disabled={processing}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-content transition-colors hover:bg-surface-muted disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-accent" />
            Load Sample Links
          </button>

          {sampleLinks.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmMode('sample')}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
            >
              <Trash2 className="h-4 w-4" />
              Clear Sample Links ({sampleLinks.length})
            </button>
          )}

          {links.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmMode('all')}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Links ({links.length})
            </button>
          )}
        </div>
      </section>

      <DeleteConfirmModal
        open={Boolean(confirmMode)}
        title={
          confirmMode === 'sample'
            ? `Clear ${sampleLinks.length} sample links?`
            : `Delete ALL ${links.length} links?`
        }
        description={
          confirmMode === 'sample'
            ? 'This removes only links marked as sample data.'
            : 'This permanently deletes every saved link in your vault across Web and Android.'
        }
        confirmLabel={confirmMode === 'sample' ? 'Clear Sample Data' : 'Delete All Links'}
        loading={processing}
        onConfirm={handleConfirmClear}
        onCancel={() => setConfirmMode(null)}
      />
    </div>
  );
}

