import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import { evaluateEligibility } from '../services/eligibility.service.js';
import mongoose from 'mongoose';

describe('Phase 3: Eligibility Service & Application Workflow', () => {
  const app = createApp();

  const collegeId = new mongoose.Types.ObjectId().toString();
  const studentId = new mongoose.Types.ObjectId().toString();
  const employerId = new mongoose.Types.ObjectId().toString();

  const collegeToken = generateToken({
    sub: collegeId,
    email: 'tpo@tier3college.ac.in',
    role: 'COLLEGE',
  });

  const studentToken = generateToken({
    sub: studentId,
    email: 'rajesh.kumar@tier3college.ac.in',
    role: 'STUDENT',
  });

  const employerToken = generateToken({
    sub: employerId,
    email: 'campus@wipro.com',
    role: 'EMPLOYER',
  });

  describe('Eligibility Evaluation Service (Deterministic Logic)', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString();

    it('should reject non-PUBLISHED drives (e.g. DRAFT)', () => {
      const result = evaluateEligibility({
        driveStatus: 'DRAFT',
        applicationDeadline: futureDate,
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons[0]).toContain('DRAFT status');
    });

    it('should reject drives with past application deadline', () => {
      const result = evaluateEligibility({
        driveStatus: 'PUBLISHED',
        applicationDeadline: pastDate,
      });

      expect(result.eligible).toBe(false);
      expect(result.reasons.some((r) => r.includes('deadline'))).toBe(true);
      expect(result.missingRequirements).toContain('Deadline Passed');
    });

    it('should reject when drive is restricted to specific cohorts and student is not in them', () => {
      const targetCohortId = '666666666666666666666661';
      const studentCohortId = '666666666666666666666662';

      const result = evaluateEligibility({
        driveStatus: 'PUBLISHED',
        applicationDeadline: futureDate,
        driveCohortIds: [targetCohortId],
        studentEnrolledCohortIds: [studentCohortId],
      });

      expect(result.eligible).toBe(false);
      expect(result.missingRequirements).toContain('Restricted Cohort Membership');
    });

    it('should allow student who belongs to the specified cohort', () => {
      const targetCohortId = '666666666666666666666661';

      const result = evaluateEligibility({
        driveStatus: 'PUBLISHED',
        applicationDeadline: futureDate,
        driveCohortIds: [targetCohortId],
        studentEnrolledCohortIds: [targetCohortId],
      });

      expect(result.eligible).toBe(true);
      expect(result.missingRequirements).toHaveLength(0);
    });

    it('should reject student when course is not in eligibleCourses', () => {
      const result = evaluateEligibility({
        driveStatus: 'PUBLISHED',
        applicationDeadline: futureDate,
        eligibleCourses: ['Computer Science', 'Information Technology'],
        studentProfile: {
          course: 'Mechanical Engineering',
        },
      });

      expect(result.eligible).toBe(false);
      expect(result.missingRequirements.some((r) => r.includes('Course Mismatch'))).toBe(true);
    });

    it('should reject student when graduationYear is not in eligibleGraduationYears', () => {
      const result = evaluateEligibility({
        driveStatus: 'PUBLISHED',
        applicationDeadline: futureDate,
        eligibleGraduationYears: [2026, 2027],
        studentProfile: {
          graduationYear: 2024,
        },
      });

      expect(result.eligible).toBe(false);
      expect(result.missingRequirements.some((r) => r.includes('Graduation Year Mismatch'))).toBe(true);
    });

    it('should accurately list specific missing skills', () => {
      const result = evaluateEligibility({
        driveStatus: 'PUBLISHED',
        applicationDeadline: futureDate,
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'Docker'],
        studentProfile: {
          skills: ['JavaScript', 'React'],
        },
      });

      expect(result.eligible).toBe(false);
      expect(result.missingRequirements).toContain('Missing Skill: Node.js');
      expect(result.missingRequirements).toContain('Missing Skill: Docker');
      expect(result.missingRequirements).not.toContain('Missing Skill: React');
    });

    it('should confirm full eligibility when all criteria are met', () => {
      const targetCohort = '666666666666666666666661';
      const result = evaluateEligibility({
        driveStatus: 'PUBLISHED',
        applicationDeadline: futureDate,
        driveCohortIds: [targetCohort],
        eligibleCourses: ['Diploma in Computer Engineering'],
        eligibleGraduationYears: [2026],
        requiredSkills: ['JavaScript', 'SQL'],
        studentProfile: {
          course: 'Diploma in Computer Engineering',
          graduationYear: 2026,
          skills: ['javascript', 'sql', 'python'],
        },
        studentEnrolledCohortIds: [targetCohort],
      });

      expect(result.eligible).toBe(true);
      expect(result.missingRequirements).toHaveLength(0);
      expect(result.reasons[0]).toContain('satisfy all academic, skill, and cohort requirements');
    });
  });

  describe('Application Endpoints RBAC & Validation', () => {
    it('should forbid non-students from applying to drives (403)', async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/placement-drives/${validObjectId}/apply`)
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject application with invalid drive ID (400)', async () => {
      const res = await request(app)
        .post('/api/placement-drives/invalid-drive-id/apply')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('should forbid students from updating application candidate statuses (403)', async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/applications/${validObjectId}/status`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'SELECTED' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject candidate status update with invalid status enum (400)', async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/applications/${validObjectId}/status`)
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({ status: 'HIRED_IMMEDIATELY' }); // Invalid enum

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Status must be one of');
    });

    it('should forbid non-students from withdrawing applications (403)', async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/applications/${validObjectId}/withdraw`)
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('College Statistics Endpoint', () => {
    it('should forbid students and employers from accessing college stats (403)', async () => {
      const res1 = await request(app)
        .get('/api/college/stats')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res1.status).toBe(403);

      const res2 = await request(app)
        .get('/api/college/stats')
        .set('Authorization', `Bearer ${employerToken}`);
      expect(res2.status).toBe(403);
    });

    it('should handle database unavailable gracefully with 503', async () => {
      const res = await request(app)
        .get('/api/college/stats')
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });
  });
});
