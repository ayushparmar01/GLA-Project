export type TenantScopeType = 'student' | 'college' | 'employer' | 'admin' | 'global';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export interface CacheStats {
  size: number;
  maxEntries: number;
  hits: number;
  misses: number;
  evictions: number;
  hitRatio: number;
}

export class CacheService {
  private static instance: CacheService | null = null;
  private readonly store: Map<string, CacheEntry<any>> = new Map();
  private readonly maxEntries: number;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(maxEntries = 5000) {
    this.maxEntries = maxEntries;
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Resets the singleton instance (useful in test setups).
   */
  public static resetInstance(): void {
    if (CacheService.instance) {
      CacheService.instance.clear();
      CacheService.instance = null;
    }
  }

  /**
   * Generates a tenant-scoped cache key to ensure absolute isolation between colleges, employers, and students.
   */
  public static buildTenantKey(
    scopeType: TenantScopeType,
    scopeId: string,
    operationKey: string
  ): string {
    const safeScopeId = scopeId.trim().toLowerCase();
    const safeOpKey = operationKey.trim().toLowerCase();
    return `cache:tenant:${scopeType}:${safeScopeId}:${safeOpKey}`;
  }

  /**
   * Retrieves a value from the cache if not expired.
   */
  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (entry.expiresAt > 0 && entry.expiresAt <= now) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    entry.lastAccessed = now;
    this.hits++;
    return entry.value as T;
  }

  /**
   * Stores a value in the cache with a specified TTL in seconds (default 300 seconds = 5 min).
   */
  public set<T>(key: string, value: T, ttlSeconds = 300): void {
    // Evict least recently accessed item if at capacity
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictLru();
    }

    const now = Date.now();
    const expiresAt = ttlSeconds > 0 ? now + ttlSeconds * 1000 : 0;

    this.store.set(key, {
      value,
      expiresAt,
      lastAccessed: now,
    });
  }

  /**
   * Deletes a specific cache key.
   */
  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Invalidates all keys associated with a specific tenant scope and scopeId.
   */
  public invalidateTenant(scopeType: TenantScopeType, scopeId: string): number {
    const prefix = `cache:tenant:${scopeType}:${scopeId.trim().toLowerCase()}:`;
    let count = 0;

    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clears all cache entries and resets metrics.
   */
  public clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Returns current cache statistics and health indicators.
   */
  public getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRatio: total > 0 ? Number((this.hits / total).toFixed(3)) : 0,
    };
  }

  /**
   * Evicts the Least Recently Used (LRU) entry when the cache is full.
   */
  private evictLru(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
      this.evictions++;
    }
  }
}
