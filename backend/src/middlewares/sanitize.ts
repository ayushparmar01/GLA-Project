import { Request, Response, NextFunction } from 'express';

/**
 * Strips MongoDB query operators starting with '$' or containing '.' from object keys
 * to prevent NoSQL injection vulnerabilities.
 */
export function sanitizeNoSqlInput<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input !== 'object') {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeNoSqlInput(item)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(input as Record<string, any>)) {
    // Drop keys that start with '$' (MongoDB operator injection) or contain '.' (path traversal injection)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeNoSqlInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Sanitizes strings to neutralize malicious cross-site scripting (XSS) payloads.
 * Strips script tags, javascript: pseudo-protocols, and inline event handlers.
 */
export function sanitizeXssString(value: string): string {
  if (typeof value !== 'string') {
    return value;
  }

  let cleaned = value;

  // 1. Remove <script ...>...</script> tags entirely
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Remove isolated script tags
  cleaned = cleaned.replace(/<script\b[^>]*>/gi, '').replace(/<\/script>/gi, '');

  // 3. Remove javascript: and vbscript: URIs
  cleaned = cleaned.replace(/javascript\s*:/gi, 'blocked:');
  cleaned = cleaned.replace(/vbscript\s*:/gi, 'blocked:');

  // 4. Remove dangerous inline event handlers (e.g. onerror=, onload=, onclick=)
  cleaned = cleaned.replace(/\bon\w+\s*=\s*(?:["'][^"']*["']|[^\s>]+)/gi, '');

  // 5. Remove dangerous data: URIs for HTML/SVG
  cleaned = cleaned.replace(/data\s*:\s*text\/html/gi, 'data:blocked');
  cleaned = cleaned.replace(/data\s*:\s*image\/svg\+xml/gi, 'data:blocked');

  return cleaned;
}

/**
 * Recursively applies XSS sanitization to all string fields in an object or array.
 */
export function sanitizeXssInput<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeXssString(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeXssInput(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(input as Record<string, any>)) {
      sanitized[key] = sanitizeXssInput(value);
    }
    return sanitized as T;
  }

  return input;
}

/**
 * Express middleware that sanitizes req.body, req.query, and req.params against
 * NoSQL injection and Cross-Site Scripting (XSS).
 */
export const sanitizeMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeXssInput(sanitizeNoSqlInput(req.body));
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeXssInput(sanitizeNoSqlInput(req.query));
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeXssInput(sanitizeNoSqlInput(req.params));
  }

  next();
};
