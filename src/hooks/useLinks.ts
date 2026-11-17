import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  PLATFORM_CATEGORIES,
  type CreateLinkInput,
  type LinkItem,
  type PlatformCategory,
  type UpdateLinkInput,
} from '../types/link';
import type { CreateActivityInput } from '../types/activity';
import {
  addBulkLinks,
  addLink,
  deleteBulkLinks,
  deleteLink,
  logActivity,
  subscribeToLinks,
  updateLink,
} from '../services/firestoreService';
import { copyMultipleUrls, copyTextToClipboard } from '../utils/clipboard';
import { normalizeUrl } from '../utils/linkParser';
import { detectPlatform } from '../utils/platformDetector';
import { LOCAL_USER_ID } from './useAuth';

const LOCAL_LINKS_KEY = 'linkvault-local-links';
export const LOCAL_ACTIVITIES_KEY = 'linkvault-local-activities';
export const LOCAL_DATA_EVENT = 'linkvault-local-data-changed';

function readLocalLinks(): LinkItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_LINKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<
      Omit<LinkItem, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt: string }
    >;
    return parsed.map((item) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      pendingSync: false,
    }));
  } catch {
    return [];
  }
}

function writeLocalLinks(items: LinkItem[]) {
  try {
    localStorage.setItem(LOCAL_LINKS_KEY, JSON.stringify(items));
  } catch {
    // ignore storage quota errors
  }
}

export function appendLocalActivity(input: CreateActivityInput) {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
    const existing = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
    const next = [
      {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId: LOCAL_USER_ID,
        action: input.action,
        summary: input.summary.trim().slice(0, 240) || input.action,
        count: input.count,
        ...(input.category ? { category: input.category } : {}),
        createdAt: new Date().toISOString(),
      },
      ...existing,
    ].slice(0, 250);
    localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(LOCAL_DATA_EVENT));
  } catch {
    // ignore
  }
}

export function useLinks(userId: string | undefined) {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [hasPendingWrites, setHasPendingWrites] = useState(false);

  const isLocalMode = userId === LOCAL_USER_ID;

  useEffect(() => {
    if (!userId) {
      setLinks([]);
      setLoading(false);
      return;
    }

    if (isLocalMode) {
      setLinks(readLocalLinks());
      setFromCache(false);
      setHasPendingWrites(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToLinks(
      userId,
      (items, meta) => {
        setLinks(items);
        setFromCache(meta.fromCache);
        setHasPendingWrites(meta.hasPendingWrites);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, isLocalMode]);

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(
      PLATFORM_CATEGORIES.map((cat) => [cat, 0])
    ) as Record<PlatformCategory, number>;

    for (const item of links) {
      counts[item.category] = (counts[item.category] ?? 0) + 1;
    }
    return counts;
  }, [links]);

  const existingNormalizedSet = useMemo(() => {
    return new Set(links.map((item) => item.normalizedUrl));
  }, [links]);

  const createLink = useCallback(
    async (input: CreateLinkInput) => {
      if (!userId) return;
      if (isLocalMode) {
        const now = new Date();
        const url = input.url.trim().slice(0, 2048);
        const category = input.category ?? detectPlatform(url);
        const title = input.title?.trim().slice(0, 120) || undefined;
        const newItem: LinkItem = {
          id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId: LOCAL_USER_ID,
          url,
          normalizedUrl: (input.normalizedUrl ?? normalizeUrl(url)).slice(0, 2048),
          category,
          ...(title ? { title } : {}),
          ...(typeof input.sampleData === 'boolean' ? { sampleData: input.sampleData } : {}),
          createdAt: now,
          updatedAt: now,
        };
        setLinks((prev) => {
          const next = [newItem, ...prev];
          writeLocalLinks(next);
          return next;
        });
        appendLocalActivity({
          action: 'ADDED',
          summary: title ? `Saved "${title}"` : `Saved ${url}`,
          count: 1,
          category,
        });
        return;
      }
      await addLink(userId, input);
    },
    [userId, isLocalMode]
  );

  const createBulkLinks = useCallback(
    async (inputs: CreateLinkInput[], actionType: 'BULK_ADDED' | 'IMPORTED' = 'BULK_ADDED') => {
      if (!userId || inputs.length === 0) return 0;
      if (isLocalMode) {
        const now = new Date();
        const created: LinkItem[] = inputs.map((item, idx) => {
          const url = item.url.trim().slice(0, 2048);
          const title = item.title?.trim().slice(0, 120) || undefined;
          return {
            id: `link-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            userId: LOCAL_USER_ID,
            url,
            normalizedUrl: (item.normalizedUrl ?? normalizeUrl(url)).slice(0, 2048),
            category: item.category ?? detectPlatform(url),
            ...(title ? { title } : {}),
            ...(typeof item.sampleData === 'boolean' ? { sampleData: item.sampleData } : {}),
            createdAt: now,
            updatedAt: now,
          };
        });
        setLinks((prev) => {
          const next = [...created, ...prev];
          writeLocalLinks(next);
          return next;
        });
        const label = actionType === 'IMPORTED' ? 'Imported' : 'Bulk saved';
        appendLocalActivity({
          action: actionType,
          summary: `${label} ${created.length} link${created.length === 1 ? '' : 's'}`,
          count: created.length,
        });
        return created.length;
      }
      return addBulkLinks(userId, inputs, actionType);
    },
    [userId, isLocalMode]
  );

  const editLink = useCallback(
    async (linkId: string, input: UpdateLinkInput) => {
      if (!userId) return;
      if (isLocalMode) {
        setLinks((prev) => {
          const next = prev.map((item) =>
            item.id === linkId
              ? {
                  ...item,
                  url: input.url.trim().slice(0, 2048),
                  normalizedUrl: input.normalizedUrl.trim().slice(0, 2048),
                  category: input.category,
                  title: input.title?.trim().slice(0, 120) || undefined,
                  updatedAt: new Date(),
                }
              : item
          );
          writeLocalLinks(next);
          return next;
        });
        toast.success('Link updated');
        return;
      }
      await updateLink(userId, linkId, input);
      toast.success('Link updated');
    },
    [userId, isLocalMode]
  );

  const removeLink = useCallback(
    async (link: LinkItem) => {
      if (!userId) return;
      if (isLocalMode) {
        setLinks((prev) => {
          const next = prev.filter((item) => item.id !== link.id);
          writeLocalLinks(next);
          return next;
        });
        appendLocalActivity({
          action: 'DELETED',
          summary: link.title ? `Deleted "${link.title}"` : `Deleted ${link.url}`,
          count: 1,
          category: link.category,
        });
        toast.success('Link deleted');
        return;
      }
      await deleteLink(userId, link);
      toast.success('Link deleted');
    },
    [userId, isLocalMode]
  );

  const removeBulkLinks = useCallback(
    async (
      selectedLinks: LinkItem[],
      actionType: 'BULK_DELETED' | 'CLEARED' = 'BULK_DELETED',
      customSummary?: string
    ) => {
      if (!userId || selectedLinks.length === 0) return 0;
      if (isLocalMode) {
        const idsToRemove = new Set(selectedLinks.map((l) => l.id));
        setLinks((prev) => {
          const next = prev.filter((item) => !idsToRemove.has(item.id));
          writeLocalLinks(next);
          return next;
        });
        appendLocalActivity({
          action: actionType,
          summary:
            customSummary ??
            `Deleted ${selectedLinks.length} link${selectedLinks.length === 1 ? '' : 's'}`,
          count: selectedLinks.length,
        });
        toast.success(
          `Deleted ${selectedLinks.length} link${selectedLinks.length === 1 ? '' : 's'}`
        );
        return selectedLinks.length;
      }
      const count = await deleteBulkLinks(userId, selectedLinks, actionType, customSummary);
      toast.success(`Deleted ${count} link${count === 1 ? '' : 's'}`);
      return count;
    },
    [userId, isLocalMode]
  );

  const copySingleLink = useCallback(
    async (link: LinkItem) => {
      const ok = await copyTextToClipboard(link.url);
      if (ok) {
        toast.success('Copied to clipboard');
        if (isLocalMode) {
          appendLocalActivity({
            action: 'COPIED',
            summary: link.title ? `Copied "${link.title}"` : `Copied ${link.url}`,
            count: 1,
            category: link.category,
          });
        } else if (userId) {
          logActivity(userId, {
            action: 'COPIED',
            summary: link.title ? `Copied "${link.title}"` : `Copied ${link.url}`,
            count: 1,
            category: link.category,
          }).catch(() => {});
        }
      } else {
        toast.error('Unable to copy link');
      }
      return ok;
    },
    [userId, isLocalMode]
  );

  const copySelectedLinks = useCallback(
    async (selectedLinks: LinkItem[]) => {
      if (selectedLinks.length === 0) return false;
      const ok = await copyMultipleUrls(selectedLinks.map((l) => l.url));
      if (ok) {
        toast.success(
          `Copied ${selectedLinks.length} link${selectedLinks.length === 1 ? '' : 's'} to clipboard`
        );
        if (isLocalMode) {
          appendLocalActivity({
            action: 'COPIED',
            summary: `Copied ${selectedLinks.length} link${selectedLinks.length === 1 ? '' : 's'}`,
            count: selectedLinks.length,
          });
        } else if (userId) {
          logActivity(userId, {
            action: 'COPIED',
            summary: `Copied ${selectedLinks.length} link${selectedLinks.length === 1 ? '' : 's'}`,
            count: selectedLinks.length,
          }).catch(() => {});
        }
      } else {
        toast.error('Unable to copy selected links');
      }
      return ok;
    },
    [userId, isLocalMode]
  );

  return {
    links,
    loading,
    error,
    fromCache,
    hasPendingWrites,
    categoryCounts,
    existingNormalizedSet,
    createLink,
    createBulkLinks,
    editLink,
    removeLink,
    removeBulkLinks,
    copySingleLink,
    copySelectedLinks,
  };
}
