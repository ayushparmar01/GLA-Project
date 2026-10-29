import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import mongoose from 'mongoose';

describe('Phase 3: Placement Drive Management Module', () => {
  const app = createApp();

  const collegeId = new mongoose.Types.ObjectId().toString();
  const studentId = new mongoose.Types.ObjectId().toString();
  const employerId = new mongoose.Types.ObjectId().toString();

  const collegeToken = generateToken({
    sub: collegeId,
    email: 'placement@rural-polytechnic.ac.in',
    role: 'COLLEGE',
  });

  const studentToken = generateToken({
    sub: studentId,
    email: 'student@district-polytechnic.ac.in',
    role: 'STUDENT',
  });

  const employerToken = generateToken({
    sub: employerId,
    email: 'hr@infosys.com',
    role: 'EMPLOYER',
  });

  describe('Authorization Rules', () => {
    it('should reject unauthenticated access to placement drives (401)', async () => {
      const res = await request(app).get('/api/placement-drives');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should forbid STUDENT from creating placement drives (403)', async () => {
      const res = await request(app)
        .post('/api/placement-drives')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Junior Web Developer Drive',
          description: 'Hiring drive for graduates',
          organizationName: 'BharatTech',
          opportunityType: 'JOB',
          applicationDeadline: '2026-12-31T23:59:59.000Z',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid EMPLOYER from creating college placement drives directly (403)', async () => {
      const res = await request(app)
        .post('/api/placement-drives')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: 'Campus Associate Drive',
          description: 'Hiring drive',
          organizationName: 'Global Corp',
          opportunityType: 'JOB',
          applicationDeadline: '2026-12-31T23:59:59.000Z',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Placement Drive Creation Validation', () => {
    it('should reject drive creation without title (400)', async () => {
      const res = await request(app)
        .post('/api/placement-drives')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          description: 'Missing title',
          organizationName: 'TCS Bharat',
          opportunityType: 'JOB',
          applicationDeadline: '2026-12-31',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Title is required');
    });

    it('should reject drive creation with too short title (400)', async () => {
      const res = await request(app)
        .post('/api/placement-drives')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          title: 'AB',
          description: 'Valid description',
          organizationName: 'TCS Bharat',
          opportunityType: 'JOB',
          applicationDeadline: '2026-12-31',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject drive creation without organization name (400)', async () => {
      const res = await request(app)
        .post('/api/placement-drives')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          title: 'Frontend Developer Intern',
          description: 'Exciting internship opportunity',
          opportunityType: 'INTERNSHIP',
          applicationDeadline: '2026-12-31',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('organization name is required');
    });

    it('should reject invalid opportunityType enum (400)', async () => {
      const res = await request(app)
        .post('/api/placement-drives')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          title: 'Graduate Trainee',
          description: 'Training and placement opportunity',
          organizationName: 'L&T Technology',
          opportunityType: 'FREELANCE', // Invalid enum
          applicationDeadline: '2026-12-31',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Opportunity type must be one of');
    });

    it('should reject invalid workMode enum (400)', async () => {
      const res = await request(app)
        .post('/api/placement-drives')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          title: 'Graduate Trainee',
          description: 'Training and placement opportunity',
          organizationName: 'L&T Technology',
          opportunityType: 'JOB',
          workMode: 'OFFSHORE', // Invalid enum
          applicationDeadline: '2026-12-31',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Work mode must be one of');
    });

    it('should reject missing applicationDeadline (400)', async () => {
      const res = await request(app)
        .post('/api/placement-drives')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          title: 'Graduate Trainee',
          description: 'Training and placement opportunity',
          organizationName: 'L&T Technology',
          opportunityType: 'JOB',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Application deadline is required');
    });

    it('should reject malformed applicationDeadline date string (400)', async () => {
      const res = await request(app)
        .post('/api/placement-drives')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          title: 'Graduate Trainee',
          description: 'Training and placement opportunity',
          organizationName: 'L&T Technology',
          opportunityType: 'JOB',
          applicationDeadline: 'not-a-valid-date-string',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('valid date format');
    });
  });

  describe('Drive State Transitions & Security', () => {
    it('should reject modifying status directly through PATCH (400)', async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/placement-drives/${validObjectId}`)
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({ status: 'PUBLISHED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PROTECTED_FIELD_MODIFICATION');
    });

    it('should reject invalid drive ID on publish (400)', async () => {
      const res = await request(app)
        .post('/api/placement-drives/invalid-id/publish')
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('should reject invalid drive ID on close (400)', async () => {
      const res = await request(app)
        .post('/api/placement-drives/invalid-id/close')
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('should reject invalid drive ID on cancel (400)', async () => {
      const res = await request(app)
        .post('/api/placement-drives/invalid-id/cancel')
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('Database Offline Handling', () => {
    it('should return 503 DATABASE_UNAVAILABLE when database is offline on drive creation', async () => {
      const res = await request(app)
        .post('/api/placement-drives')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          title: 'Junior Web Developer',
          description: 'Full time role for final year students',
          organizationName: 'Rural Innovations Pvt Ltd',
          opportunityType: 'JOB',
          workMode: 'HYBRID',
          location: 'Pune / Remote',
          applicationDeadline: '2026-12-31T23:59:59.000Z',
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });
  });
});
