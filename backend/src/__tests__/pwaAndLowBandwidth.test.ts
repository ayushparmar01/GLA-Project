import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Phase 12 — PWA & Low-Bandwidth Optimization Backend Tests', () => {
  const app = createApp();

  describe('1. API Metadata and Phase 12 Conformance', () => {
    it('GET /api should report valid API metadata', async () => {
      const res = await request(app).get('/api');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'CareerBridge API');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('phase');
    });

    it('GET / should report root gateway online status', async () => {
      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('service', 'CareerBridge Backend Server');
      expect(res.body).toHaveProperty('status', 'online');
    });
  });

  describe('2. Low-Bandwidth Payload Efficiency', () => {
    it('GET /api/health should return a lightweight response (< 2KB) suitable for 2G/3G networks', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const payloadSize = Buffer.byteLength(JSON.stringify(res.body), 'utf8');
      expect(payloadSize).toBeLessThan(2048);
    });

    it('GET /api/skills should return active skill taxonomy without requiring auth headers', async () => {
      const res = await request(app).get('/api/skills');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
    });

    it('GET /api/events should support public event discovery without auth headers', async () => {
      const res = await request(app).get('/api/events');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });

  describe('3. Cache Safety & Security Headers Enforcement', () => {
    it('should include Helmet security headers preventing MIME-sniffing and clickjacking', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers).toHaveProperty('content-security-policy');
    });

    it('should reject unauthenticated access to private student records with 401', async () => {
      const res = await request(app).get('/api/students/me/profile');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('should reject unauthenticated access to private admin control centre with 401', async () => {
      const res = await request(app).get('/api/admin/metrics');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
    });

    it('should reject oversized payloads (>100kb) to protect rural bandwidth limits', async () => {
      // Generate a payload exceeding 100kb
      const hugeString = 'A'.repeat(120 * 1024);
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: hugeString });

      // Body-parser should reject payload too large (413)
      expect(res.status).toBe(413);
    });
  });

  describe('4. Rapid Ping & Network Recovery Resilience', () => {
    it('should handle repeated rapid health checks simulating intermittent network reconnects', async () => {
      const pings = await Promise.all([
        request(app).get('/api/health'),
        request(app).get('/api/health'),
        request(app).get('/api/health'),
      ]);

      pings.forEach((res) => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });
  });
});
