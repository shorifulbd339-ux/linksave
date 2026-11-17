import {
  endOfDay,
  format,
  formatDistanceToNow,
  isWithinInterval,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns';
import type { DateFilterState } from '../types/filter';

export function matchesDateFilter(date: Date, filter: DateFilterState): boolean {
  if (filter.preset === 'all') return true;

  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = endOfDay(now);

  switch (filter.preset) {
    case 'today':
      start = startOfDay(now);
      break;
    case '7d':
      start = startOfDay(subDays(now, 6));
      break;
    case '30d':
      start = startOfDay(subDays(now, 29));
      break;
    case 'custom': {
      if (filter.startDate) {
        const parsedStart = parseISO(filter.startDate);
        if (!Number.isNaN(parsedStart.getTime())) {
          start = startOfDay(parsedStart);
        }
      }
      if (filter.endDate) {
        const parsedEnd = parseISO(filter.endDate);
        if (!Number.isNaN(parsedEnd.getTime())) {
          end = endOfDay(parsedEnd);
        }
      }
      break;
    }
  }

  if (start && end) {
    if (start > end) return false;
    return isWithinInterval(date, { start, end });
  }
  if (start) return date >= start;
  if (end) return date <= end;
  return true;
}

export function formatRelativeTime(date: Date): string {
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '';
  }
}

export function formatShortDate(date: Date): string {
  try {
    return format(date, 'MMM d, yyyy');
  } catch {
    return '';
  }
}

export function formatDateTime(date: Date): string {
  try {
    return format(date, 'MMM d, yyyy · h:mm a');
  } catch {
    return '';
  }
}

