import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { generateToken } from '../utils/auth.js';
import { errorHandler } from '../middlewares/errorHandler.js';

describe('Role-Based Access Control (RBAC) Middleware', () => {
  // Construct an isolated test app exercising the RBAC middleware directly
  const app = express();
  app.use(express.json());

  // Protected route exclusively for Students
  app.get('/test/student-only', authenticate, authorizeRole('STUDENT'), (req, res) => {
    res.json({ success: true, message: 'Welcome to Student portal', user: req.user });
  });

  // Protected route exclusively for Employers
  app.get('/test/employer-only', authenticate, authorizeRole('EMPLOYER'), (req, res) => {
    res.json({ success: true, message: 'Welcome to Employer portal', user: req.user });
  });

  // Protected route exclusively for Colleges
  app.get('/test/college-only', authenticate, authorizeRole('COLLEGE'), (req, res) => {
    res.json({ success: true, message: 'Welcome to College portal', user: req.user });
  });

  // Multi-role route (Students & Colleges)
  app.get('/test/student-or-college', authenticate, authorizeRole('STUDENT', 'COLLEGE'), (req, res) => {
    res.json({ success: true, message: 'Academic access granted', user: req.user });
  });

  app.use(errorHandler);

  const studentToken = generateToken({
    sub: 'student_123',
    email: 'student@district.edu',
    role: 'STUDENT',
  });

  const employerToken = generateToken({
    sub: 'employer_456',
    email: 'hr@techcorp.in',
    role: 'EMPLOYER',
  });

  const collegeToken = generateToken({
    sub: 'college_789',
    email: 'principal@rural-polytechnic.ac.in',
    role: 'COLLEGE',
  });

  describe('Unauthenticated Access', () => {
    it('should return 401 for requests without credentials', async () => {
      const res = await request(app).get('/test/student-only');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Student Access Rules', () => {
    it('STUDENT should successfully access student-only route', async () => {
      const res = await request(app)
        .get('/test/student-only')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('STUDENT');
    });

    it('STUDENT should be denied access (403) to employer-only route', async () => {
      const res = await request(app)
        .get('/test/employer-only')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(res.body.error.message).toContain('Access denied');
    });

    it('STUDENT should be denied access (403) to college-only route', async () => {
      const res = await request(app)
        .get('/test/college-only')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Employer Access Rules', () => {
    it('EMPLOYER should successfully access employer-only route', async () => {
      const res = await request(app)
        .get('/test/employer-only')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('EMPLOYER');
    });

    it('EMPLOYER should be denied access (403) to student-only route', async () => {
      const res = await request(app)
        .get('/test/student-only')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('EMPLOYER should be denied access (403) to college-only route', async () => {
      const res = await request(app)
        .get('/test/college-only')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('College Access Rules', () => {
    it('COLLEGE should successfully access college-only route', async () => {
      const res = await request(app)
        .get('/test/college-only')
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('COLLEGE');
    });

    it('COLLEGE should be denied access (403) to employer-only route', async () => {
      const res = await request(app)
        .get('/test/employer-only')
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Multi-Role Route Rules', () => {
    it('should permit STUDENT on multi-role student-or-college route', async () => {
      const res = await request(app)
        .get('/test/student-or-college')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should permit COLLEGE on multi-role student-or-college route', async () => {
      const res = await request(app)
        .get('/test/student-or-college')
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should forbid EMPLOYER on multi-role student-or-college route', async () => {
      const res = await request(app)
        .get('/test/student-or-college')
        .set('Authorization', `Bearer ${employerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
