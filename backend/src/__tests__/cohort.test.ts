import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import mongoose from 'mongoose';

describe('Phase 3: Cohort Management Module', () => {
  const app = createApp();

  const collegeId = new mongoose.Types.ObjectId().toString();
  const otherCollegeId = new mongoose.Types.ObjectId().toString();
  const studentId = new mongoose.Types.ObjectId().toString();
  const employerId = new mongoose.Types.ObjectId().toString();

  const collegeToken = generateToken({
    sub: collegeId,
    email: 'placement@rural-polytechnic.ac.in',
    role: 'COLLEGE',
  });

  const otherCollegeToken = generateToken({
    sub: otherCollegeId,
    email: 'admin@other-college.ac.in',
    role: 'COLLEGE',
  });

  const studentToken = generateToken({
    sub: studentId,
    email: 'priya.sharma@rural-polytechnic.ac.in',
    role: 'STUDENT',
  });

  const employerToken = generateToken({
    sub: employerId,
    email: 'recruiter@techbharat.in',
    role: 'EMPLOYER',
  });

  describe('RBAC & Route Protection', () => {
    it('should reject unauthenticated requests to cohort endpoints with 401', async () => {
      const res = await request(app).get('/api/cohorts');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should forbid STUDENT from creating cohorts (403)', async () => {
      const res = await request(app)
        .post('/api/cohorts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Batch 2026 CS' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid EMPLOYER from creating cohorts (403)', async () => {
      const res = await request(app)
        .post('/api/cohorts')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ name: 'Recruitment Group A' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Input Validation on Cohort Creation', () => {
    it('should reject cohort creation without a name (400)', async () => {
      const res = await request(app)
        .post('/api/cohorts')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({ description: 'Missing name cohort' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('name is required');
    });

    it('should reject cohort creation with too short name (400)', async () => {
      const res = await request(app)
        .post('/api/cohorts')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({ name: 'A' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject cohort creation with invalid graduation year (400)', async () => {
      const res = await request(app)
        .post('/api/cohorts')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({ name: 'Batch 2050', graduationYear: 2055 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Graduation year must be a valid year');
    });
  });

  describe('Cohort Updating & Parameter Security', () => {
    it('should reject invalid cohort ID format with 400', async () => {
      const res = await request(app)
        .get('/api/cohorts/invalid-hex-id')
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('should reject direct tampering with collegeId or studentIds via PATCH (400)', async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/cohorts/${validObjectId}`)
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({ collegeId: 'tampered_id', name: 'New Name' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PROTECTED_FIELD_MODIFICATION');
    });
  });

  describe('Student Enrollment Validation', () => {
    it('should reject enrollment when email is missing (400)', async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/cohorts/${validObjectId}/students`)
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Student email is required');
    });

    it('should forbid students from enrolling themselves or others (403)', async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/cohorts/${validObjectId}/students`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ email: 'peer@student.edu' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Fault-Tolerant Offline Database Handling', () => {
    it('should return 503 DATABASE_UNAVAILABLE when database is disconnected on valid request', async () => {
      const res = await request(app)
        .post('/api/cohorts')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          name: 'Diploma CSE 2026',
          academicYear: '2025-2026',
          course: 'Diploma in Computer Science & Engineering',
          graduationYear: 2026,
        });

      // When DB is offline, returns 503 instead of crashing or returning false 201
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });
  });
});
