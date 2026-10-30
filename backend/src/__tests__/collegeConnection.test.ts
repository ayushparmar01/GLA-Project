import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import mongoose from 'mongoose';

describe('Phase 4: College-Employer Connection Module', () => {
  const app = createApp();

  const employerId = new mongoose.Types.ObjectId().toString();
  const collegeId = new mongoose.Types.ObjectId().toString();
  const studentId = new mongoose.Types.ObjectId().toString();

  const employerToken = generateToken({
    sub: employerId,
    email: 'recruiting@tcsbharat.in',
    role: 'EMPLOYER',
  });

  const collegeToken = generateToken({
    sub: collegeId,
    email: 'placement@ruralpolytechnic.edu.in',
    role: 'COLLEGE',
  });

  const studentToken = generateToken({
    sub: studentId,
    email: 'student@ruralpolytechnic.edu.in',
    role: 'STUDENT',
  });

  describe('Authorization Rules', () => {
    it('should reject unauthenticated request to connect with college (401)', async () => {
      const res = await request(app)
        .post('/api/employers/connections')
        .send({ collegeId });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should forbid STUDENT from initiating college connections (403)', async () => {
      const res = await request(app)
        .post('/api/employers/connections')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          collegeId,
          message: 'Can I connect with the college?',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid COLLEGE from initiating connection via employer route (403)', async () => {
      const res = await request(app)
        .post('/api/employers/connections')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          collegeId,
          message: 'Connecting to another college',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid EMPLOYER from responding to connection requests (403)', async () => {
      const fakeConnectionId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/connections/${fakeConnectionId}/respond`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          status: 'ACCEPTED',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid STUDENT from responding to connection requests (403)', async () => {
      const fakeConnectionId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/connections/${fakeConnectionId}/respond`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          status: 'ACCEPTED',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Validation & Parameters', () => {
    it('should reject invalid collegeId format on connection request (400)', async () => {
      const res = await request(app)
        .post('/api/employers/connections')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          collegeId: 'invalid-college-id',
          message: 'We are eager to hire your computer engineering graduates.',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('should reject message exceeding 1000 characters (400)', async () => {
      const longMessage = 'A'.repeat(1001);
      const res = await request(app)
        .post('/api/employers/connections')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          collegeId,
          message: longMessage,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Message cannot exceed 1000 characters');
    });

    it('should reject invalid status on connection response (400)', async () => {
      const fakeConnectionId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/connections/${fakeConnectionId}/respond`)
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          status: 'PENDING', // Must be ACCEPTED or REJECTED
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Status must be ACCEPTED or REJECTED');
    });

    it('should reject invalid connectionId format on response (400)', async () => {
      const res = await request(app)
        .patch('/api/connections/invalid-id/respond')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          status: 'ACCEPTED',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('should reject invalid connectionId format on block (400)', async () => {
      const res = await request(app)
        .post('/api/connections/invalid-id/block')
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('Database Offline Handling', () => {
    it('should return 503 DATABASE_UNAVAILABLE when database is offline on connection request', async () => {
      const res = await request(app)
        .post('/api/employers/connections')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          collegeId,
          message: 'Campus recruitment invitation for batch 2026.',
        });

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });

    it('should return 503 DATABASE_UNAVAILABLE when fetching employer connections offline', async () => {
      const res = await request(app)
        .get('/api/employers/connections')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });
  });
});
