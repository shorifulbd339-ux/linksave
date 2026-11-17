import { Link } from 'react-router-dom';
import { Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { PLATFORM_LIST } from '../../config/platforms';
import type { PlatformCategory } from '../../types/link';

interface CategoryDistributionChartProps {
  counts: Record<PlatformCategory, number>;
  total: number;
  onCopyCategory?: (category: PlatformCategory) => void;
}

export function CategoryDistributionChart({
  counts,
  total,
  onCopyCategory,
}: CategoryDistributionChartProps) {
  const sorted = [...PLATFORM_LIST].sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));

  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-content">Platform Distribution</h2>
          <p className="text-xs text-content-secondary">
            Tap any platform to filter, or click Copy to copy all links of that platform
          </p>
        </div>
      </div>

      {/* Stacked bar */}
      {total > 0 ? (
        <div className="mb-5 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
          {sorted.map((platform) => {
            const count = counts[platform.id] ?? 0;
            if (count === 0) return null;
            const pct = (count / total) * 100;
            return (
              <div
                key={platform.id}
                style={{ width: `${pct}%`, backgroundColor: platform.barColor }}
                title={`${platform.label}: ${count} (${Math.round(pct)}%)`}
                className="h-full transition-all duration-500"
              />
            );
          })}
        </div>
      ) : (
        <div className="mb-5 h-2.5 w-full rounded-full bg-surface-muted" />
      )}

      {/* Platform cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {sorted.map((platform) => {
          const count = counts[platform.id] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const Icon = platform.icon;
          return (
            <div
              key={platform.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-border bg-surface/60 p-3 transition-all hover:border-border-strong hover:bg-surface-elevated hover:shadow-soft"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={`/category/${platform.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2.5"
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm ${platform.badgeBg} ${platform.badgeText} ${platform.badgeBorder}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-content group-hover:text-accent">
                      {platform.label}
                    </p>
                    <p className="font-mono text-[11px] font-semibold text-content-secondary">
                      {count} link{count === 1 ? '' : 's'}
                    </p>
                  </div>
                </Link>

                {onCopyCategory && count > 0 && (
                  <button
                    type="button"
                    onClick={() => onCopyCategory(platform.id)}
                    title={`Copy all ${platform.label} links`}
                    aria-label={`Copy all ${platform.label} links`}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated text-content-secondary transition-colors hover:border-accent/40 hover:bg-accent hover:text-white active:scale-90"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ backgroundColor: platform.barColor }}
                  className="h-full rounded-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
