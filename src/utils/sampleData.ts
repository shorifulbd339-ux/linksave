import type { CreateLinkInput } from '../types/link';
import { parseSingleLink } from './linkParser';

const RAW_SAMPLES: Array<{ url: string; title: string }> = [
  {
    url: 'https://x.com/reactjs/status/1840000000000000000',
    title: 'React 19 Concurrent Rendering Thread',
  },
  {
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Design Systems Deep Dive — YouTube',
  },
  {
    url: 'https://youtu.be/Ke90Tje7VS0',
    title: 'TypeScript Architecture Crash Course',
  },
  {
    url: 'https://www.facebook.com/watch/?v=10159999999999999',
    title: 'Product Launch Keynote Replay',
  },
  {
    url: 'https://t.me/androiddevdigest/4210',
    title: 'Android & Jetpack Compose Weekly Digest',
  },
  {
    url: 'https://developer.chrome.com/docs/workbox/',
    title: 'Workbox PWA Caching Strategies',
  },
];

export function buildSampleLinks(): CreateLinkInput[] {
  const results: CreateLinkInput[] = [];
  for (const item of RAW_SAMPLES) {
    const parsed = parseSingleLink(item.url, undefined, item.title);
    if (parsed) {
      results.push({
        ...parsed,
        sampleData: true,
      });
    }
  }
  return results;
}
