export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface StructuredLogPayload {
  level: LogLevel;
  timestamp: string;
  requestId?: string;
  message: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  userId?: string;
  userRole?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const SENSITIVE_KEY_PATTERNS = [
  /pass(word)?/i,
  /token/i,
  /secret/i,
  /auth(orization)?/i,
  /api[_-]?key/i,
  /cookie/i,
  /credit[_-]?card/i,
  /cvv/i,
  /bearer/i,
];

/**
 * Recursively redacts sensitive values (passwords, tokens, keys) from an object before logging.
 */
export function sanitizeLogData<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    // Redact bearer tokens in strings like 'Bearer eyJhb...'
    if (/bearer\s+[a-zA-Z0-9.\-_]+/i.test(input)) {
      return input.replace(/bearer\s+[a-zA-Z0-9.\-_]+/gi, 'Bearer ***REDACTED***') as unknown as T;
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeLogData(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(input as Record<string, any>)) {
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitiveKey) {
        sanitized[key] = '***REDACTED***';
      } else if (val !== null && typeof val === 'object') {
        sanitized[key] = sanitizeLogData(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized as T;
  }

  return input;
}

export class LoggerService {
  private static isTestEnv = process.env.NODE_ENV === 'test';

  public static info(message: string, context?: Partial<StructuredLogPayload>): StructuredLogPayload {
    return this.log('INFO', message, context);
  }

  public static warn(message: string, context?: Partial<StructuredLogPayload>): StructuredLogPayload {
    return this.log('WARN', message, context);
  }

  public static error(message: string, context?: Partial<StructuredLogPayload>): StructuredLogPayload {
    return this.log('ERROR', message, context);
  }

  public static debug(message: string, context?: Partial<StructuredLogPayload>): StructuredLogPayload {
    return this.log('DEBUG', message, context);
  }

  private static log(
    level: LogLevel,
    message: string,
    context?: Partial<StructuredLogPayload>
  ): StructuredLogPayload {
    const payload: StructuredLogPayload = {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...context,
      metadata: context?.metadata ? sanitizeLogData(context.metadata) : undefined,
    };

    // If not in silent test execution, emit structured JSON to standard output
    if (!this.isTestEnv || process.env.VERBOSE_TEST_LOGS === 'true') {
      const json = JSON.stringify(payload);
      if (level === 'ERROR') {
        console.error(json);
      } else if (level === 'WARN') {
        console.warn(json);
      } else {
        console.log(json);
      }
    }

    return payload;
  }
}
