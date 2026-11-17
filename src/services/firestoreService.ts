import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ActivityAction, ActivityItem, CreateActivityInput } from '../types/activity';
import type { CreateLinkInput, LinkItem, PlatformCategory, UpdateLinkInput } from '../types/link';
import { normalizeUrl } from '../utils/linkParser';
import { detectPlatform } from '../utils/platformDetector';

function requireDb() {
  if (!db) {
    throw new Error('Firestore is not initialized. Check your Firebase .env configuration.');
  }
  return db;
}

function linksCollection(userId: string) {
  return collection(requireDb(), 'users', userId, 'links');
}

function activitiesCollection(userId: string) {
  return collection(requireDb(), 'users', userId, 'activities');
}

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return new Date();
}

export interface LinksSnapshotMeta {
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export function subscribeToLinks(
  userId: string,
  onData: (links: LinkItem[], meta: LinksSnapshotMeta) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const q = query(linksCollection(userId), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const items: LinkItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: String(data.userId ?? userId),
          url: String(data.url ?? ''),
          normalizedUrl: String(data.normalizedUrl ?? data.url ?? ''),
          category: (data.category as PlatformCategory) ?? 'other',
          title: typeof data.title === 'string' && data.title.length > 0 ? data.title : undefined,
          sampleData: typeof data.sampleData === 'boolean' ? data.sampleData : undefined,
          createdAt: toDate(data.createdAt),
          updatedAt: toDate(data.updatedAt),
          pendingSync: docSnap.metadata.hasPendingWrites,
        };
      });

      onData(items, {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    (err) => onError(err)
  );
}

export function subscribeToActivities(
  userId: string,
  onData: (activities: ActivityItem[]) => void,
  onError: (error: Error) => void,
  maxItems = 250
): Unsubscribe {
  const q = query(activitiesCollection(userId), orderBy('createdAt', 'desc'), limit(maxItems));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: ActivityItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          userId: String(data.userId ?? userId),
          action: (data.action as ActivityAction) ?? 'ADDED',
          summary: String(data.summary ?? ''),
          count: typeof data.count === 'number' ? data.count : 0,
          category:
            typeof data.category === 'string' ? (data.category as PlatformCategory) : undefined,
          createdAt: toDate(data.createdAt),
        };
      });
      onData(items);
    },
    (err) => onError(err)
  );
}

export async function logActivity(userId: string, input: CreateActivityInput): Promise<void> {
  const ref = doc(activitiesCollection(userId));
  const summary = input.summary.trim().slice(0, 240) || input.action;
  const count = Math.max(0, Math.min(100000, Math.trunc(input.count)));

  await setDoc(ref, {
    userId,
    action: input.action,
    summary,
    count,
    ...(input.category ? { category: input.category } : {}),
    createdAt: serverTimestamp(),
  });
}

export async function addLink(userId: string, input: CreateLinkInput): Promise<string> {
  const ref = doc(linksCollection(userId));
  const url = input.url.trim().slice(0, 2048);
  const normalizedUrl = (input.normalizedUrl ?? normalizeUrl(url)).slice(0, 2048);
  const category = input.category ?? detectPlatform(url);
  const trimmedTitle = input.title?.trim().slice(0, 120);

  await setDoc(ref, {
    userId,
    url,
    normalizedUrl,
    category,
    ...(trimmedTitle ? { title: trimmedTitle } : {}),
    ...(typeof input.sampleData === 'boolean' ? { sampleData: input.sampleData } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await logActivity(userId, {
    action: 'ADDED',
    summary: trimmedTitle ? `Saved "${trimmedTitle}"` : `Saved ${url}`,
    count: 1,
    category,
  });

  return ref.id;
}

export async function addBulkLinks(
  userId: string,
  inputs: CreateLinkInput[],
  actionType: 'BULK_ADDED' | 'IMPORTED' = 'BULK_ADDED'
): Promise<number> {
  if (inputs.length === 0) return 0;

  const CHUNK_SIZE = 450;
  let savedCount = 0;

  for (let i = 0; i < inputs.length; i += CHUNK_SIZE) {
    const chunk = inputs.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(requireDb());

    for (const item of chunk) {
      const ref = doc(linksCollection(userId));
      const url = item.url.trim().slice(0, 2048);
      const normalizedUrl = (item.normalizedUrl ?? normalizeUrl(url)).slice(0, 2048);
      const category = item.category ?? detectPlatform(url);
      const trimmedTitle = item.title?.trim().slice(0, 120);

      batch.set(ref, {
        userId,
        url,
        normalizedUrl,
        category,
        ...(trimmedTitle ? { title: trimmedTitle } : {}),
        ...(typeof item.sampleData === 'boolean' ? { sampleData: item.sampleData } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      savedCount += 1;
    }

    await batch.commit();
  }

  const label = actionType === 'IMPORTED' ? 'Imported' : 'Bulk saved';
  await logActivity(userId, {
    action: actionType,
    summary: `${label} ${savedCount} link${savedCount === 1 ? '' : 's'}`,
    count: savedCount,
    ...(inputs.length === 1 && inputs[0].category ? { category: inputs[0].category } : {}),
  });

  return savedCount;
}

export async function updateLink(
  userId: string,
  linkId: string,
  input: UpdateLinkInput
): Promise<void> {
  const ref = doc(requireDb(), 'users', userId, 'links', linkId);
  const url = input.url.trim().slice(0, 2048);
  const normalizedUrl = input.normalizedUrl.trim().slice(0, 2048);
  const trimmedTitle = input.title?.trim().slice(0, 120);

  await updateDoc(ref, {
    url,
    normalizedUrl,
    category: input.category,
    title: trimmedTitle ? trimmedTitle : deleteField(),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteLink(userId: string, link: LinkItem): Promise<void> {
  const ref = doc(requireDb(), 'users', userId, 'links', link.id);
  await deleteDoc(ref);

  await logActivity(userId, {
    action: 'DELETED',
    summary: link.title ? `Deleted "${link.title}"` : `Deleted ${link.url}`,
    count: 1,
    category: link.category,
  });
}

export async function deleteBulkLinks(
  userId: string,
  links: LinkItem[],
  actionType: 'BULK_DELETED' | 'CLEARED' = 'BULK_DELETED',
  customSummary?: string
): Promise<number> {
  if (links.length === 0) return 0;

  const CHUNK_SIZE = 450;
  for (let i = 0; i < links.length; i += CHUNK_SIZE) {
    const chunk = links.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(requireDb());
    for (const item of chunk) {
      batch.delete(doc(requireDb(), 'users', userId, 'links', item.id));
    }
    await batch.commit();
  }

  await logActivity(userId, {
    action: actionType,
    summary:
      customSummary ?? `Deleted ${links.length} link${links.length === 1 ? '' : 's'}`,
    count: links.length,
  });

  return links.length;
}

export async function clearActivities(userId: string, activities: ActivityItem[]): Promise<void> {
  if (activities.length === 0) return;
  const CHUNK_SIZE = 450;
  for (let i = 0; i < activities.length; i += CHUNK_SIZE) {
    const chunk = activities.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(requireDb());
    for (const act of chunk) {
      batch.delete(doc(requireDb(), 'users', userId, 'activities', act.id));
    }
    await batch.commit();
  }
}

