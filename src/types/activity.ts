import type { PlatformCategory } from './link';

export type ActivityAction =
  | 'ADDED'
  | 'BULK_ADDED'
  | 'COPIED'
  | 'DELETED'
  | 'BULK_DELETED'
  | 'IMPORTED'
  | 'EXPORTED'
  | 'CLEARED';

export interface ActivityItem {
  id: string;
  userId: string;
  action: ActivityAction;
  summary: string;
  count: number;
  category?: PlatformCategory;
  createdAt: Date;
}

export interface CreateActivityInput {
  action: ActivityAction;
  summary: string;
  count: number;
  category?: PlatformCategory;
}

