import type { PlatformCategory } from './link';

export type DateRangePreset = 'all' | 'today' | '7d' | '30d' | 'custom';

export type SortOption = 'newest' | 'oldest' | 'title' | 'platform';

export interface DateFilterState {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD or ''
  endDate: string; // YYYY-MM-DD or ''
}

export interface LinkFilterState {
  query: string;
  category: PlatformCategory | 'all';
  dateFilter: DateFilterState;
  sort: SortOption;
}

