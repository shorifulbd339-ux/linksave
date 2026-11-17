import { PLATFORMS } from '../../config/platforms';
import type { PlatformCategory } from '../../types/link';

interface PlatformBadgeProps {
  category: PlatformCategory;
  compact?: boolean;
}

export function PlatformBadge({ category, compact = false }: PlatformBadgeProps) {
  const meta = PLATFORMS[category] ?? PLATFORMS.other;
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-xs font-medium ${meta.badgeBg} ${meta.badgeText} ${meta.badgeBorder}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {!compact && <span>{meta.label}</span>}
    </span>
  );
}

