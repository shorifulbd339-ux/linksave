import { PLATFORM_LIST } from '../config/platforms';
import type { PlatformCategory } from '../types/link';

export function detectPlatform(rawUrl: string): PlatformCategory {
  try {
    const withProtocol = /^https?:\/\//i.test(rawUrl.trim())
      ? rawUrl.trim()
      : `https://${rawUrl.trim()}`;
    const parsed = new URL(withProtocol);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    for (const platform of PLATFORM_LIST) {
      if (platform.id === 'other') continue;
      for (const domain of platform.domains) {
        if (hostname === domain || hostname.endsWith(`.${domain}`)) {
          return platform.id;
        }
      }
    }

    return 'other';
  } catch {
    return 'other';
  }
}

export function extractDisplayHost(rawUrl: string): string {
  try {
    const withProtocol = /^https?:\/\//i.test(rawUrl.trim())
      ? rawUrl.trim()
      : `https://${rawUrl.trim()}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}

