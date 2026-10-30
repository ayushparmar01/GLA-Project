import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import mongoose from 'mongoose';

describe('Phase 4: Employer Opportunity Management Module', () => {
  const app = createApp();

  const employerId = new mongoose.Types.ObjectId().toString();
  const studentId = new mongoose.Types.ObjectId().toString();
  const collegeId = new mongoose.Types.ObjectId().toString();

  const employerToken = generateToken({
    sub: employerId,
    email: 'recruiter@techbharat.org',
    role: 'EMPLOYER',
  });

  const studentToken = generateToken({
    sub: studentId,
    email: 'student@polytechnic.edu.in',
    role: 'STUDENT',
  });

  const collegeToken = generateToken({
    sub: collegeId,
    email: 'tpo@tier3college.ac.in',
    role: 'COLLEGE',
  });

  describe('Authorization Rules', () => {
    it('should reject unauthenticated access to employer opportunities (401)', async () => {
      const res = await request(app).get('/api/employers/opportunities');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should forbid STUDENT from creating employer opportunities (403)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Full Stack Engineer',
          description: 'Hiring fresh graduates for web development roles.',
          opportunityType: 'JOB',
          applicationDeadline: '2026-12-31T23:59:59.000Z',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid COLLEGE from creating opportunities via employer route (403)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          title: 'Full Stack Engineer',
          description: 'Hiring fresh graduates for web development roles.',
          opportunityType: 'JOB',
          applicationDeadline: '2026-12-31T23:59:59.000Z',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Opportunity Creation Validation', () => {
    it('should reject opportunity creation without title (400)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          description: 'Valid description for graduate trainee',
          opportunityType: 'JOB',
          applicationDeadline: '2026-12-31T23:59:59.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Title is required');
    });

    it('should reject title shorter than 3 characters (400)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: 'UI',
          description: 'Valid description for graduate trainee',
          opportunityType: 'JOB',
          applicationDeadline: '2026-12-31T23:59:59.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Title must be at least 3 characters');
    });

    it('should reject missing description (400)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: 'Junior Cloud Architect',
          opportunityType: 'JOB',
          applicationDeadline: '2026-12-31T23:59:59.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Description is required');
    });

    it('should reject invalid opportunityType (400)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: 'Junior Cloud Architect',
          description: 'Full time position for engineering graduates.',
          opportunityType: 'CONTRACT_GIG', // Invalid enum
          applicationDeadline: '2026-12-31T23:59:59.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Opportunity type must be one of');
    });

    it('should reject missing applicationDeadline (400)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: 'Junior Cloud Architect',
          description: 'Full time position for engineering graduates.',
          opportunityType: 'JOB',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Application deadline is required');
    });

    it('should reject invalid applicationDeadline format (400)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: 'Junior Cloud Architect',
          description: 'Full time position for engineering graduates.',
          opportunityType: 'JOB',
          applicationDeadline: 'next-wednesday',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('valid date');
    });

    it('should reject past applicationDeadline (400)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: 'Junior Cloud Architect',
          description: 'Full time position for engineering graduates.',
          opportunityType: 'JOB',
          applicationDeadline: '2020-01-01T00:00:00.000Z',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Application deadline must be in the future');
    });

    it('should reject invalid minimumCGPA outside 0-10 range (400)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: 'Junior Cloud Architect',
          description: 'Full time position for engineering graduates.',
          opportunityType: 'JOB',
          applicationDeadline: '2026-12-31T23:59:59.000Z',
          minimumCGPA: 12.5, // Invalid CGPA
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Minimum CGPA must be a number between 0 and 10');
    });
  });

  describe('Security & Lifecycle Transitions', () => {
    it('should reject directly modifying status via PATCH (400)', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/employers/opportunities/${fakeId}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          status: 'PUBLISHED',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PROTECTED_FIELD_MODIFICATION');
    });

    it('should reject invalid opportunity ID format on publish (400)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities/invalid-id/publish')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('should reject invalid opportunity ID format on close (400)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities/invalid-id/close')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('should reject invalid opportunity ID format on cancel (400)', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities/invalid-id/cancel')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('Database Offline Handling', () => {
    it('should return 503 DATABASE_UNAVAILABLE when database is offline on opportunity creation', async () => {
      const res = await request(app)
        .post('/api/employers/opportunities')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: 'Software Development Engineer',
          description: 'Hiring core backend engineers.',
          opportunityType: 'JOB',
          workMode: 'REMOTE',
          applicationDeadline: '2026-12-31T23:59:59.000Z',
        });

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });

    it('should return 503 DATABASE_UNAVAILABLE when fetching opportunities list offline', async () => {
      const res = await request(app)
        .get('/api/employers/opportunities')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });
  });
});
