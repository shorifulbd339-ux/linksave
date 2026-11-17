import type { PlatformCategory } from '../types/link';
import { detectPlatform } from './platformDetector';

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'igsh',
  'igshid',
  'si',
  's',
  't',
  'ref',
  'ref_src',
  'ref_url',
  'feature',
  'app',
  'is_from_webapp',
  'sender_device',
]);

export interface ParsedLinkCandidate {
  url: string;
  normalizedUrl: string;
  category: PlatformCategory;
  title?: string;
}

export function ensureProtocol(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isValidHttpUrl(raw: string): boolean {
  try {
    const withProto = ensureProtocol(raw);
    if (withProto.length < 4 || withProto.length > 2048) return false;
    const url = new URL(withProto);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (!url.hostname || !url.hostname.includes('.')) return false;
    return true;
  } catch {
    return false;
  }
}

export function normalizeUrl(raw: string): string {
  const withProto = ensureProtocol(raw);
  try {
    const parsed = new URL(withProto);
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    // Strip known tracking query params
    for (const key of Array.from(parsed.searchParams.keys())) {
      if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        parsed.searchParams.delete(key);
      }
    }

    // Sort remaining search params for deterministic deduplication
    parsed.searchParams.sort();
    parsed.hash = '';

    let normalized = parsed.toString();
    if (normalized.endsWith('/') && parsed.pathname === '/' && !parsed.search) {
      normalized = normalized.slice(0, -1);
    } else if (normalized.endsWith('/') && parsed.pathname.length > 1 && !parsed.search) {
      normalized = normalized.slice(0, -1);
    }

    return normalized.slice(0, 2048);
  } catch {
    return withProto.slice(0, 2048);
  }
}

export function parseSingleLink(
  rawUrl: string,
  overrideCategory?: PlatformCategory,
  title?: string
): ParsedLinkCandidate | null {
  if (!isValidHttpUrl(rawUrl)) return null;
  const url = ensureProtocol(rawUrl).slice(0, 2048);
  const normalizedUrl = normalizeUrl(url);
  const category = overrideCategory ?? detectPlatform(url);
  const trimmedTitle = title?.trim();

  return {
    url,
    normalizedUrl,
    category,
    ...(trimmedTitle ? { title: trimmedTitle.slice(0, 120) } : {}),
  };
}

const URL_EXTRACT_REGEX =
  /(?:https?:\/\/|www\.)(?:(?!https?:\/\/|www\.)[^\s<>"'`)\]])+/gi;

export function formatUrlsPerLine(rawText: string): string {
  const matches = rawText.match(URL_EXTRACT_REGEX) ?? [];
  if (matches.length === 0) return rawText;
  const cleaned = matches
    .map((m) => m.replace(/[),.;:!?]+$/, '').trim())
    .filter((m) => isValidHttpUrl(m));
  if (cleaned.length === 0) return rawText;
  return cleaned.join('\n');
}

export interface BulkParseResult {
  candidates: ParsedLinkCandidate[];
  invalidLines: string[];
  duplicateInInputCount: number;
}

export function extractLinksFromText(
  rawText: string,
  overrideCategory?: PlatformCategory
): BulkParseResult {
  const matches = rawText.match(URL_EXTRACT_REGEX) ?? [];
  const seenNormalized = new Set<string>();
  const candidates: ParsedLinkCandidate[] = [];
  let duplicateInInputCount = 0;

  for (const match of matches) {
    const cleaned = match.replace(/[),.;:!?]+$/, '');
    const parsed = parseSingleLink(cleaned, overrideCategory);
    if (!parsed) continue;
    if (seenNormalized.has(parsed.normalizedUrl)) {
      duplicateInInputCount += 1;
      continue;
    }
    seenNormalized.add(parsed.normalizedUrl);
    candidates.push(parsed);
  }

  // Also check lines that had text but didn't produce a valid URL
  const invalidLines: string[] = [];
  for (const line of rawText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const lineMatches = trimmed.match(URL_EXTRACT_REGEX);
    if (!lineMatches || lineMatches.length === 0) {
      invalidLines.push(trimmed);
    }
  }

  return {
    candidates,
    invalidLines,
    duplicateInInputCount,
  };
}

