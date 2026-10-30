/**
 * Frontend Security Utilities (Phase 19: Advanced Security, Performance & Scalability)
 */

export const SENSITIVE_STORAGE_DENYLIST: RegExp[] = [
  /token/i,
  /pass(word)?/i,
  /auth/i,
  /secret/i,
  /credential/i,
  /session/i,
  /private[_-]?key/i,
];

/**
 * Checks whether a given storage key or data property contains sensitive authentication
 * or confidential credentials that MUST NOT be cached in client-side storage (localStorage / IndexedDB).
 */
export function isSensitiveStorageKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  return SENSITIVE_STORAGE_DENYLIST.some((pattern) => pattern.test(key));
}

/**
 * Safe client-side storage wrapper that enforces the sensitive credential denylist.
 * Throws or rejects attempts to store sensitive data in insecure web storage.
 */
export function safeSetLocalStorageItem(key: string, value: string): boolean {
  if (isSensitiveStorageKey(key)) {
    console.warn(`[Security Warning] Blocked attempt to persist sensitive key "${key}" to localStorage.`);
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.error('[Storage Error] Failed to write to localStorage:', err);
    return false;
  }
}

/**
 * Sanitizes user-generated or external plain text to prevent XSS execution in rendered UI.
 */
export function sanitizePlainText(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '') // Strip HTML tags
    .replace(/javascript\s*:/gi, 'blocked:')
    .trim();
}

/**
 * Parses HTTP 429 Too Many Requests response headers and payload
 * to extract human-readable retry delays.
 */
export function parseRateLimitResponse(response: Response, payload?: any): {
  isRateLimited: boolean;
  retryAfterSeconds: number;
  message: string;
} {
  if (response.status !== 429) {
    return { isRateLimited: false, retryAfterSeconds: 0, message: '' };
  }

  const retryHeader = response.headers.get('Retry-After');
  let retrySeconds = retryHeader ? parseInt(retryHeader, 10) : 60;
  if (isNaN(retrySeconds) || retrySeconds <= 0) {
    retrySeconds = 60;
  }

  const message =
    payload?.error?.message ||
    payload?.message ||
    `Rate limit exceeded. Please wait ${retrySeconds} seconds before trying again.`;

  return {
    isRateLimited: true,
    retryAfterSeconds: retrySeconds,
    message,
  };
}
