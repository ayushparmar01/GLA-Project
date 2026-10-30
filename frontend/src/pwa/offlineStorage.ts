import { isSensitiveStorageKey } from '../utils/security';

export interface OfflineResourceItem {
  id: string;
  category: 'learning' | 'skill' | 'event' | 'roadmap';
  title: string;
  data: any;
  cachedAt: number;
}

const OFFLINE_STORAGE_PREFIX = 'cb_offline_res_';

/**
 * Stores a safe public or student learning resource for offline access.
 * Rejects any item whose key or payload matches the sensitive credential denylist.
 */
export function cacheResourceOffline(
  resourceId: string,
  category: 'learning' | 'skill' | 'event' | 'roadmap',
  title: string,
  data: any
): boolean {
  if (isSensitiveStorageKey(resourceId) || isSensitiveStorageKey(title)) {
    console.warn(`[PWA Security] Blocked offline caching of sensitive resource: ${resourceId}`);
    return false;
  }

  // Deep check payload for token or password keys
  if (data && typeof data === 'object') {
    const jsonStr = JSON.stringify(data);
    if (/("password"|"token"|"secret"|"cb_token")/i.test(jsonStr)) {
      console.warn(`[PWA Security] Blocked offline caching of payload containing sensitive tokens.`);
      return false;
    }
  }

  try {
    const item: OfflineResourceItem = {
      id: resourceId,
      category,
      title,
      data,
      cachedAt: Date.now(),
    };
    localStorage.setItem(`${OFFLINE_STORAGE_PREFIX}${resourceId}`, JSON.stringify(item));
    return true;
  } catch (err) {
    console.error('[PWA Storage] Quota exceeded or error saving offline resource:', err);
    return false;
  }
}

/**
 * Retrieves a previously cached offline resource.
 */
export function getOfflineResource(resourceId: string): OfflineResourceItem | null {
  try {
    const raw = localStorage.getItem(`${OFFLINE_STORAGE_PREFIX}${resourceId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Lists all currently cached offline resources.
 */
export function listOfflineResources(): OfflineResourceItem[] {
  const items: OfflineResourceItem[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(OFFLINE_STORAGE_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            items.push(JSON.parse(raw));
          } catch {
            // ignore corrupt entry
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return items;
}

/**
 * Removes an offline resource from cache.
 */
export function removeOfflineResource(resourceId: string): boolean {
  try {
    localStorage.removeItem(`${OFFLINE_STORAGE_PREFIX}${resourceId}`);
    return true;
  } catch {
    return false;
  }
}
