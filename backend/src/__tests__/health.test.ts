import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Health and API Base Endpoints', () => {
  const app = createApp();

  it('GET /api/health should return 200 and valid health diagnostic payload', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('service', 'CareerBridge API');
    expect(res.body.data).toHaveProperty('version', '0.1.0');
    expect(res.body.data).toHaveProperty('status');
    expect(['healthy', 'degraded']).toContain(res.body.data.status);
    expect(res.body.data).toHaveProperty('services');
    expect(res.body.data.services).toHaveProperty('database');
    expect(res.body.data.services.database).toHaveProperty('status');
    expect(res.body.data.services).toHaveProperty('icanSandbox');
    expect(res.body.data.services.icanSandbox).toHaveProperty('note');
  });

  it('GET /api should return API discovery metadata', async () => {
    const res = await request(app).get('/api');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'CareerBridge API');
    expect(res.body).toHaveProperty('version');
    expect(res.body.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('GET /unknown-route should return structured 404 error response', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('code', 'ROUTE_NOT_FOUND');
  });
});
