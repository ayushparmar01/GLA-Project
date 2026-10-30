import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import mongoose from 'mongoose';

describe('Phase 4: Recruitment Desk & Interview Scheduling Module', () => {
  const app = createApp();

  const employerId = new mongoose.Types.ObjectId().toString();
  const studentId = new mongoose.Types.ObjectId().toString();
  const collegeId = new mongoose.Types.ObjectId().toString();

  const employerToken = generateToken({
    sub: employerId,
    email: 'hr@bharatcloud.in',
    role: 'EMPLOYER',
  });

  const studentToken = generateToken({
    sub: studentId,
    email: 'ananya@ruralpolytechnic.ac.in',
    role: 'STUDENT',
  });

  const collegeToken = generateToken({
    sub: collegeId,
    email: 'placement@ruralpolytechnic.ac.in',
    role: 'COLLEGE',
  });

  describe('Authorization Rules', () => {
    it('should reject unauthenticated request to employer dashboard stats (401)', async () => {
      const res = await request(app).get('/api/employers/dashboard/stats');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should forbid STUDENT from accessing employer dashboard stats (403)', async () => {
      const res = await request(app)
        .get('/api/employers/dashboard/stats')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid COLLEGE from accessing employer dashboard stats (403)', async () => {
      const res = await request(app)
        .get('/api/employers/dashboard/stats')
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid STUDENT from scheduling interviews (403)', async () => {
      const res = await request(app)
        .post('/api/employers/interviews')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          applicationId: new mongoose.Types.ObjectId().toString(),
          interviewRound: 'Technical Round 1',
          interviewType: 'ONLINE',
          scheduledAt: '2026-12-15T10:00:00.000Z',
          meetingLink: 'https://meet.google.com/xyz-abcd-efg',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid EMPLOYER from accessing student interviews list (403)', async () => {
      const res = await request(app)
        .get('/api/students/me/interviews')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Recruitment Desk Validation', () => {
    it('should reject invalid driveId on candidate applications lookup (400)', async () => {
      const res = await request(app)
        .get('/api/employers/opportunities/invalid-id/applications')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('should reject invalid applicationId on status update (400)', async () => {
      const res = await request(app)
        .patch('/api/employers/applications/invalid-id/status')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          status: 'SHORTLISTED',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('should reject invalid recruitment status enum (400)', async () => {
      const fakeAppId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/employers/applications/${fakeAppId}/status`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          status: 'OFFER_MADE', // Invalid enum
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Status must be one of');
    });
  });

  describe('Interview Scheduling Validation', () => {
    it('should reject interview scheduling without applicationId (400)', async () => {
      const res = await request(app)
        .post('/api/employers/interviews')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          interviewRound: 'Technical Interview',
          interviewType: 'ONLINE',
          scheduledAt: '2026-12-15T10:00:00.000Z',
          meetingLink: 'https://meet.google.com/xyz-abcd-efg',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('applicationId is required');
    });

    it('should reject interview scheduling with past scheduledAt (400)', async () => {
      const fakeAppId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/employers/interviews')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          applicationId: fakeAppId,
          interviewRound: 'Technical Round 1',
          interviewType: 'ONLINE',
          scheduledAt: '2020-01-01T10:00:00.000Z',
          meetingLink: 'https://meet.google.com/xyz-abcd-efg',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('scheduledAt must be in the future');
    });

    it('should reject ONLINE interview without meetingLink (400)', async () => {
      const fakeAppId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/employers/interviews')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          applicationId: fakeAppId,
          interviewRound: 'HR Screening',
          interviewType: 'ONLINE',
          scheduledAt: '2026-12-15T10:00:00.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('meetingLink is required for online interviews');
    });

    it('should reject OFFLINE interview without location (400)', async () => {
      const fakeAppId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/employers/interviews')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          applicationId: fakeAppId,
          interviewRound: 'On-campus Round',
          interviewType: 'OFFLINE',
          scheduledAt: '2026-12-15T10:00:00.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('location is required for offline interviews');
    });

    it('should reject invalid interviewId on reschedule (400)', async () => {
      const res = await request(app)
        .patch('/api/employers/interviews/invalid-id/reschedule')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          scheduledAt: '2026-12-20T10:00:00.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('should reject invalid interviewId on cancel (400)', async () => {
      const res = await request(app)
        .patch('/api/employers/interviews/invalid-id/cancel')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('Database Offline Handling', () => {
    it('should return 503 DATABASE_UNAVAILABLE when fetching employer dashboard stats offline', async () => {
      const res = await request(app)
        .get('/api/employers/dashboard/stats')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });

    it('should return 503 DATABASE_UNAVAILABLE when student fetches interviews offline', async () => {
      const res = await request(app)
        .get('/api/students/me/interviews')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });
  });
});
