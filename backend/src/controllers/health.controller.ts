import { Request, Response } from 'express';
import { ApiResponse, HealthCheckData } from '../types/index.js';
import { getDbStatus } from '../config/db.js';
import { config } from '../config/env.js';
import { CacheService } from '../services/cache.service.js';

export const getHealth = (req: Request, res: Response): void => {
  const dbStatus = getDbStatus();
  const isDbConnected = dbStatus.status === 'connected';
  const mem = process.memoryUsage();
  const cacheStats = CacheService.getInstance().getStats();

  const healthData: HealthCheckData = {
    service: 'CareerBridge API',
    version: '0.1.0',
    status: isDbConnected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.nodeEnv,
    services: {
      database: dbStatus,
      icanSandbox: {
        status: config.icanSandboxApiKey ? 'ready' : 'unconfigured',
        configured: Boolean(config.icanSandboxApiKey),
        targetEnvironment: config.icanSandboxBaseUrl,
        note: 'ICAN sandbox adapter structured for upcoming placement & skill assessment phases',
      },
      cache: {
        size: cacheStats.size,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRatio: cacheStats.hitRatio,
        status: 'in-memory-lru-active',
      },
      memory: {
        heapUsedMb: Math.round((mem.heapUsed / (1024 * 1024)) * 100) / 100,
        heapTotalMb: Math.round((mem.heapTotal / (1024 * 1024)) * 100) / 100,
        rssMb: Math.round((mem.rss / (1024 * 1024)) * 100) / 100,
      },
      security: {
        noSqlSanitization: true,
        xssSanitization: true,
        rateLimiting: true,
        tenantIsolation: true,
      },
    },
  };

  const response: ApiResponse<HealthCheckData> = {
    success: true,
    data: healthData,
  };

  // We return HTTP 200 even in degraded mode so clients receive detailed diagnostic payload
  res.status(200).json(response);
};
