import { PLATFORM_CATEGORIES, type CreateLinkInput, type LinkItem, type PlatformCategory } from '../types/link';
import { extractLinksFromText, parseSingleLink } from './linkParser';

export interface LinkVaultBackupPayload {
  app: 'LinkVault';
  version: 1;
  exportedAt: string;
  count: number;
  links: Array<{
    url: string;
    normalizedUrl: string;
    category: PlatformCategory;
    title?: string;
    createdAt: string;
  }>;
}

export function exportLinksToJson(links: LinkItem[]): string {
  const payload: LinkVaultBackupPayload = {
    app: 'LinkVault',
    version: 1,
    exportedAt: new Date().toISOString(),
    count: links.length,
    links: links.map((link) => ({
      url: link.url,
      normalizedUrl: link.normalizedUrl,
      category: link.category,
      ...(link.title ? { title: link.title } : {}),
      createdAt: link.createdAt.toISOString(),
    })),
  };
  return JSON.stringify(payload, null, 2);
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportLinksToCsv(links: LinkItem[]): string {
  const header = ['url', 'category', 'title', 'createdAt', 'updatedAt'].join(',');
  const rows = links.map((link) =>
    [
      escapeCsvCell(link.url),
      escapeCsvCell(link.category),
      escapeCsvCell(link.title ?? ''),
      escapeCsvCell(link.createdAt.toISOString()),
      escapeCsvCell(link.updatedAt.toISOString()),
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

export function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function isValidPlatform(value: unknown): value is PlatformCategory {
  return typeof value === 'string' && (PLATFORM_CATEGORIES as readonly string[]).includes(value);
}

export function parseImportedBackup(rawContent: string, filename: string): CreateLinkInput[] {
  const trimmed = rawContent.trim();
  if (!trimmed) return [];

  // Try JSON first
  if (filename.toLowerCase().endsWith('.json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      const list = Array.isArray(parsed)
        ? parsed
        : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as { links?: unknown }).links)
          ? (parsed as { links: unknown[] }).links
          : [];

      const results: CreateLinkInput[] = [];
      for (const entry of list) {
        if (typeof entry !== 'object' || entry === null) continue;
        const record = entry as Record<string, unknown>;
        if (typeof record.url !== 'string') continue;
        const category = isValidPlatform(record.category) ? record.category : undefined;
        const title = typeof record.title === 'string' ? record.title : undefined;
        const candidate = parseSingleLink(record.url, category, title);
        if (candidate) {
          results.push(candidate);
        }
      }
      return results;
    } catch {
      // Fall through to text/CSV parsing
    }
  }

  // Try CSV if header matches or .csv extension
  if (filename.toLowerCase().endsWith('.csv')) {
    const lines = trimmed.split(/\r?\n/);
    const results: CreateLinkInput[] = [];
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line) continue;
      if (i === 0 && line.toLowerCase().startsWith('url,')) continue;
      const cells = parseCsvLine(line);
      const rawUrl = cells[0] ?? '';
      const rawCat = cells[1];
      const rawTitle = cells[2];
      const category = isValidPlatform(rawCat) ? rawCat : undefined;
      const candidate = parseSingleLink(rawUrl, category, rawTitle);
      if (candidate) {
        results.push(candidate);
      }
    }
    if (results.length > 0) return results;
  }

  // Fallback: extract URLs from plain text
  return extractLinksFromText(trimmed).candidates;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

