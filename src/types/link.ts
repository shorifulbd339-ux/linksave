export type PlatformCategory =
  | 'twitter'
  | 'youtube'
  | 'facebook'
  | 'telegram'
  | 'other';

export const PLATFORM_CATEGORIES: readonly PlatformCategory[] = [
  'twitter',
  'youtube',
  'facebook',
  'telegram',
  'other',
] as const;

export interface LinkItem {
  id: string;
  userId: string;
  url: string;
  normalizedUrl: string;
  category: PlatformCategory;
  title?: string;
  sampleData?: boolean;
  createdAt: Date;
  updatedAt: Date;
  pendingSync?: boolean;
}

export interface CreateLinkInput {
  url: string;
  normalizedUrl?: string;
  category?: PlatformCategory;
  title?: string;
  sampleData?: boolean;
}

export interface UpdateLinkInput {
  url: string;
  normalizedUrl: string;
  category: PlatformCategory;
  title?: string;
}
