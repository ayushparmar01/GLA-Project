import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import mongoose from 'mongoose';

describe('Phase 4: Employer Profile & Verification Module', () => {
  const app = createApp();

  const employerId = new mongoose.Types.ObjectId().toString();
  const studentId = new mongoose.Types.ObjectId().toString();
  const collegeId = new mongoose.Types.ObjectId().toString();

  const employerToken = generateToken({
    sub: employerId,
    email: 'hr@infosystech.com',
    role: 'EMPLOYER',
  });

  const studentToken = generateToken({
    sub: studentId,
    email: 'student@polytechnic.edu.in',
    role: 'STUDENT',
  });

  const collegeToken = generateToken({
    sub: collegeId,
    email: 'principal@ruralengg.ac.in',
    role: 'COLLEGE',
  });

  describe('Authorization Rules', () => {
    it('should reject unauthenticated access to employer profile (401)', async () => {
      const res = await request(app).get('/api/employers/profile/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should forbid STUDENT from creating an employer profile (403)', async () => {
      const res = await request(app)
        .post('/api/employers/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          companyName: 'Student Ventures',
          companyDescription: 'Innovative student startup working on tech.',
          companyWebsite: 'https://studentventures.in',
          industry: 'Technology',
          contactPerson: 'Rohan Sharma',
          designation: 'CEO',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid COLLEGE from creating an employer profile (403)', async () => {
      const res = await request(app)
        .post('/api/employers/profile')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          companyName: 'College Hiring Arm',
          companyDescription: 'Hiring division of technical university.',
          companyWebsite: 'https://collegehiring.org',
          industry: 'Education',
          contactPerson: 'Dr. Placement Officer',
          designation: 'Director',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Profile Creation Validation', () => {
    it('should reject profile creation without companyName (400)', async () => {
      const res = await request(app)
        .post('/api/employers/profile')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          companyDescription: 'Software product development company.',
          companyWebsite: 'https://techcorp.in',
          industry: 'IT',
          contactPerson: 'Anita Rao',
          designation: 'Head of People',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Company name is required');
    });

    it('should reject companyName shorter than 2 characters (400)', async () => {
      const res = await request(app)
        .post('/api/employers/profile')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          companyName: 'X',
          companyDescription: 'Software product development company.',
          companyWebsite: 'https://techcorp.in',
          industry: 'IT',
          contactPerson: 'Anita Rao',
          designation: 'Head of People',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Company name must be at least 2 characters');
    });

    it('should reject missing companyDescription (400)', async () => {
      const res = await request(app)
        .post('/api/employers/profile')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          companyName: 'Bharat Infotech',
          companyWebsite: 'https://bharatinfotech.in',
          industry: 'Technology',
          contactPerson: 'Anita Rao',
          designation: 'Head of People',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Company description is required');
    });

    it('should reject companyDescription shorter than 10 characters (400)', async () => {
      const res = await request(app)
        .post('/api/employers/profile')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          companyName: 'Bharat Infotech',
          companyDescription: 'Too short',
          companyWebsite: 'https://bharatinfotech.in',
          industry: 'Technology',
          contactPerson: 'Anita Rao',
          designation: 'Head of People',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Company description must be at least 10 characters');
    });

    it('should reject missing companyWebsite (400)', async () => {
      const res = await request(app)
        .post('/api/employers/profile')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          companyName: 'Bharat Infotech',
          companyDescription: 'Scalable cloud infrastructure provider in tier-2 cities.',
          industry: 'Cloud Computing',
          contactPerson: 'Anita Rao',
          designation: 'Head of People',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Valid company website URL is required');
    });

    it('should reject malformed companyWebsite URL (400)', async () => {
      const res = await request(app)
        .post('/api/employers/profile')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          companyName: 'Bharat Infotech',
          companyDescription: 'Scalable cloud infrastructure provider in tier-2 cities.',
          companyWebsite: 'htp://not-a-valid-url',
          industry: 'Cloud Computing',
          contactPerson: 'Anita Rao',
          designation: 'Head of People',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Valid company website URL is required');
    });

    it('should reject missing contactPerson (400)', async () => {
      const res = await request(app)
        .post('/api/employers/profile')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          companyName: 'Bharat Infotech',
          companyDescription: 'Scalable cloud infrastructure provider in tier-2 cities.',
          companyWebsite: 'https://bharatinfotech.in',
          industry: 'Cloud Computing',
          designation: 'Head of People',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Contact person name is required');
    });
  });

  describe('Self-Verification Tampering & Security', () => {
    it('should reject employer attempting to self-verify via PATCH /profile/me (400)', async () => {
      const res = await request(app)
        .patch('/api/employers/profile/me')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          verified: true,
          verificationStatus: 'VERIFIED',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PROTECTED_FIELD_MODIFICATION');
      expect(res.body.error.message).toContain('cannot modify verification status directly');
    });

    it('should reject employer attempting to change userId (400)', async () => {
      const anotherUserId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch('/api/employers/profile/me')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          userId: anotherUserId,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('PROTECTED_FIELD_MODIFICATION');
    });
  });

  describe('Profile Verification Workflow Authorization', () => {
    it('should forbid EMPLOYER from verifying company profiles (403)', async () => {
      const profileId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/employers/${profileId}/verify`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          status: 'VERIFIED',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should forbid STUDENT from verifying company profiles (403)', async () => {
      const profileId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/employers/${profileId}/verify`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          status: 'VERIFIED',
        });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject invalid verification status value (400)', async () => {
      const profileId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .patch(`/api/employers/${profileId}/verify`)
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          status: 'SUPER_VERIFIED', // Invalid status
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('status must be one of');
    });

    it('should reject invalid profile ID on verification (400)', async () => {
      const res = await request(app)
        .patch('/api/employers/invalid-id/verify')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          status: 'VERIFIED',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('Public Profile Access', () => {
    it('should reject invalid profile ID on public profile lookup (400)', async () => {
      const res = await request(app).get('/api/employers/invalid-profile-id');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });
  });

  describe('Database Offline Handling', () => {
    it('should return 503 DATABASE_UNAVAILABLE when database is offline on profile creation', async () => {
      const res = await request(app)
        .post('/api/employers/profile')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          companyName: 'Bharat Infotech',
          companyDescription: 'Scalable cloud infrastructure provider in tier-2 cities.',
          companyWebsite: 'https://bharatinfotech.in',
          industry: 'Cloud Computing',
          contactPerson: 'Anita Rao',
          designation: 'Head of People',
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });

    it('should return 503 DATABASE_UNAVAILABLE when getting profile while offline', async () => {
      const res = await request(app)
        .get('/api/employers/profile/me')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });
  });
});
