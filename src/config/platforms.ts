import {
  Facebook,
  Youtube,
  Twitter,
  Send,
  Globe,
  type LucideIcon,
} from 'lucide-react';
import type { PlatformCategory } from '../types/link';

export interface PlatformMeta {
  id: PlatformCategory;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  color: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barColor: string;
  domains: string[];
}

export const PLATFORMS: Record<PlatformCategory, PlatformMeta> = {
  twitter: {
    id: 'twitter',
    label: 'X / Twitter',
    shortLabel: 'X',
    icon: Twitter,
    color: '#0EA5E9',
    badgeBg: 'bg-sky-500/10 dark:bg-sky-500/15',
    badgeText: 'text-sky-600 dark:text-sky-400',
    badgeBorder: 'border-sky-500/25',
    barColor: '#0EA5E9',
    domains: ['twitter.com', 'x.com', 'mobile.twitter.com', 't.co'],
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    shortLabel: 'YT',
    icon: Youtube,
    color: '#EF4444',
    badgeBg: 'bg-red-500/10 dark:bg-red-500/15',
    badgeText: 'text-red-600 dark:text-red-400',
    badgeBorder: 'border-red-500/25',
    barColor: '#EF4444',
    domains: ['youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com'],
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    shortLabel: 'FB',
    icon: Facebook,
    color: '#1877F2',
    badgeBg: 'bg-blue-500/10 dark:bg-blue-500/15',
    badgeText: 'text-blue-600 dark:text-blue-400',
    badgeBorder: 'border-blue-500/25',
    barColor: '#1877F2',
    domains: ['facebook.com', 'fb.com', 'fb.watch', 'm.facebook.com', 'l.facebook.com'],
  },
  telegram: {
    id: 'telegram',
    label: 'Telegram',
    shortLabel: 'TG',
    icon: Send,
    color: '#06B6D4',
    badgeBg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    badgeText: 'text-cyan-600 dark:text-cyan-400',
    badgeBorder: 'border-cyan-500/25',
    barColor: '#06B6D4',
    domains: ['t.me', 'telegram.me', 'telegram.org'],
  },
  other: {
    id: 'other',
    label: 'Other',
    shortLabel: 'OTHER',
    icon: Globe,
    color: '#71717A',
    badgeBg: 'bg-zinc-500/10 dark:bg-zinc-500/15',
    badgeText: 'text-zinc-600 dark:text-zinc-400',
    badgeBorder: 'border-zinc-500/25',
    barColor: '#71717A',
    domains: [],
  },
};

export const PLATFORM_LIST: PlatformMeta[] = Object.values(PLATFORMS);
