import { Calendar, ArrowUpDown } from 'lucide-react';
import type { DateFilterState, DateRangePreset, SortOption } from '../../types/filter';

interface DateFilterBarProps {
  dateFilter: DateFilterState;
  onDateFilterChange: (next: DateFilterState) => void;
  sort?: SortOption;
  onSortChange?: (next: SortOption) => void;
}

const PRESETS: Array<{ id: DateRangePreset; label: string }> = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: 'custom', label: 'Custom' },
];

export function DateFilterBar({
  dateFilter,
  onDateFilterChange,
  sort,
  onSortChange,
}: DateFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-content-muted">
          <Calendar className="h-3.5 w-3.5" />
          Date:
        </span>
        {PRESETS.map((preset) => {
          const active = dateFilter.preset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onDateFilterChange({
                  ...dateFilter,
                  preset: preset.id,
                })
              }
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-accent text-white shadow-sm'
                  : 'bg-surface-elevated text-content-secondary border border-border hover:border-border-strong hover:text-content'
              }`}
            >
              {preset.label}
            </button>
          );
        })}

        {dateFilter.preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-1.5 pl-1">
            <input
              type="date"
              value={dateFilter.startDate}
              onChange={(e) =>
                onDateFilterChange({ ...dateFilter, startDate: e.target.value })
              }
              aria-label="Start date"
              className="rounded-lg border border-border bg-surface-elevated px-2.5 py-1 text-xs text-content focus:border-accent focus:outline-none"
            />
            <span className="text-xs text-content-muted">to</span>
            <input
              type="date"
              value={dateFilter.endDate}
              onChange={(e) =>
                onDateFilterChange({ ...dateFilter, endDate: e.target.value })
              }
              aria-label="End date"
              className="rounded-lg border border-border bg-surface-elevated px-2.5 py-1 text-xs text-content focus:border-accent focus:outline-none"
            />
          </div>
        )}
      </div>

      {sort && onSortChange && (
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-content-muted" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            aria-label="Sort links"
            className="rounded-lg border border-border bg-surface-elevated px-2.5 py-1.5 text-xs font-medium text-content focus:border-accent focus:outline-none"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title (A-Z)</option>
            <option value="platform">Platform</option>
          </select>
        </div>
      )}
    </div>
  );
}

