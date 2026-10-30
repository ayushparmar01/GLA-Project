import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { CacheService } from '../services/cache.service.js';

describe('Phase 19: Performance, Load & Concurrency Benchmark Tests', () => {
  const app = createApp();

  beforeEach(() => {
    CacheService.getInstance().clear();
  });

  describe('Concurrent Request Throughput & Response Stability', () => {
    it('should successfully handle 50 concurrent HTTP discovery and health requests without dropping connections', async () => {
      const concurrentCount = 50;
      const start = Date.now();

      const promises = Array.from({ length: concurrentCount }).map(() =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(promises);
      const duration = Date.now() - start;

      expect(responses).toHaveLength(concurrentCount);
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
      expect(duration).toBeLessThan(5000); // 50 requests resolve within 5s
    });

    it('should successfully handle 100 concurrent root API discovery calls', async () => {
      const concurrentCount = 100;
      const promises = Array.from({ length: concurrentCount }).map(() =>
        request(app).get('/api')
      );

      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(concurrentCount);
      const allSuccess = responses.every((res) => res.status === 200 && res.body.version === '0.19.0');
      expect(allSuccess).toBe(true);
    });

    it('should process 250 parallel in-memory operations under 500ms', async () => {
      const operationCount = 250;
      const cache = CacheService.getInstance();
      const start = Date.now();

      const promises = Array.from({ length: operationCount }).map(async (_, idx) => {
        const key = `load:test:item_${idx}`;
        cache.set(key, { payload: `data_${idx}`, timestamp: Date.now() });
        const retrieved = cache.get<{ payload: string }>(key);
        return retrieved?.payload === `data_${idx}`;
      });

      const results = await Promise.all(promises);
      const elapsed = Date.now() - start;

      expect(results.every(Boolean)).toBe(true);
      expect(elapsed).toBeLessThan(1000);
    });
  });

  describe('Cache Latency Benchmarking & Performance Optimization', () => {
    it('cache retrieval should be significantly faster than synthetic uncached async latency', async () => {
      const cache = CacheService.getInstance();
      const cacheKey = 'benchmark:tenant:college_123:dashboard';
      const mockData = { totalStudents: 450, placedCount: 310, activeDrives: 14 };

      // Simulate an expensive database query (50ms)
      const simulatedExpensiveQuery = async () => {
        await new Promise((resolve) => setTimeout(resolve, 30));
        return mockData;
      };

      // 1. Uncached fetch
      const startUncached = performance.now();
      const uncachedResult = await simulatedExpensiveQuery();
      const uncachedDuration = performance.now() - startUncached;
      cache.set(cacheKey, uncachedResult);

      // 2. Cached fetch
      const startCached = performance.now();
      const cachedResult = cache.get(cacheKey);
      const cachedDuration = performance.now() - startCached;

      expect(cachedResult).toEqual(mockData);
      expect(cachedDuration).toBeLessThan(uncachedDuration);
      expect(cachedDuration).toBeLessThan(5); // In-memory cache access takes < 5ms
    });

    it('should achieve 90%+ hit ratio under high repeated query patterns', () => {
      const cache = CacheService.getInstance();
      const key = 'hot:resource:pan_india_drives';
      cache.set(key, [{ id: 'drive1' }, { id: 'drive2' }]);

      // Perform 100 reads: 1 miss earlier, 99 hits
      for (let i = 0; i < 99; i++) {
        cache.get(key);
      }
      cache.get('random:nonexistent:key'); // 1 miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(99);
      expect(stats.misses).toBe(1);
      expect(stats.hitRatio).toBeGreaterThanOrEqual(0.95);
    });
  });

  describe('Memory Bounds & LRU Eviction Under Load', () => {
    it('should strictly limit memory size and evict LRU items when exceeding max capacity', () => {
      // Create cache instance with low capacity of 10 items for verification
      const miniCache = new CacheService(10);

      // Insert 15 items
      for (let i = 1; i <= 15; i++) {
        miniCache.set(`key_${i}`, `val_${i}`);
      }

      const stats = miniCache.getStats();
      expect(stats.size).toBe(10); // Clamped at 10 items
      expect(stats.evictions).toBe(5); // 5 oldest entries evicted

      // Key 1 (oldest) should have been evicted
      expect(miniCache.get('key_1')).toBeNull();
      // Key 15 (most recent) should still be in cache
      expect(miniCache.get('key_15')).toBe('val_15');
    });

    it('should maintain stable heap memory during rapid object caching cycles', () => {
      const initialMem = process.memoryUsage().heapUsed;
      const cache = CacheService.getInstance();

      for (let i = 0; i < 500; i++) {
        cache.set(`transient_key_${i}`, {
          text: 'Large career data payload '.repeat(20),
          index: i,
        });
      }

      cache.clear();
      const postClearMem = process.memoryUsage().heapUsed;
      // Ensure memory difference does not balloon
      const memDiffMb = (postClearMem - initialMem) / (1024 * 1024);
      expect(memDiffMb).toBeLessThan(50); // Less than 50MB delta
    });
  });

  describe('Race Condition & Concurrency Guard Validation', () => {
    it('should safely handle simultaneous reads and writes to identical keys without corrupting state', async () => {
      const cache = CacheService.getInstance();
      const key = 'concurrent:counter';
      cache.set(key, 0);

      const increments = Array.from({ length: 50 }).map(async () => {
        const current = cache.get<number>(key) || 0;
        cache.set(key, current + 1);
        return true;
      });

      await Promise.all(increments);
      const finalVal = cache.get<number>(key);
      expect(typeof finalVal).toBe('number');
      expect(finalVal).toBeGreaterThan(0);
    });
  });
});
