/**
 * Safe Offline Draft Storage Manager
 * Prevents data loss during network dropouts while strictly barring sensitive credentials.
 */

const DRAFT_PREFIX = 'cb_draft_';

// Denylist of sensitive keys that MUST NEVER be stored in client draft caches
const FORBIDDEN_KEYS = [
  'password',
  'token',
  'jwt',
  'secret',
  'admin',
  'credential',
  'cookie',
  'auth',
];

function isSafeDraftKey(key: string): boolean {
  const lower = key.toLowerCase();
  return !FORBIDDEN_KEYS.some((forbidden) => lower.includes(forbidden));
}

export function saveLocalDraft<T>(key: string, data: T): boolean {
  if (typeof localStorage === 'undefined') return false;

  if (!isSafeDraftKey(key)) {
    console.warn(`[DraftStorage] Refusing to store sensitive key: ${key}`);
    return false;
  }

  try {
    const payload = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(`${DRAFT_PREFIX}${key}`, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[DraftStorage] Failed to save local draft:', err);
    return false;
  }
}

export function loadLocalDraft<T>(key: string, maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): T | null {
  if (typeof localStorage === 'undefined') return null;

  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${key}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.data) {
      return null;
    }

    // Check expiration
    if (parsed.timestamp && Date.now() - parsed.timestamp > maxAgeMs) {
      clearLocalDraft(key);
      return null;
    }

    return parsed.data as T;
  } catch {
    return null;
  }
}

export function clearLocalDraft(key: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(`${DRAFT_PREFIX}${key}`);
}
