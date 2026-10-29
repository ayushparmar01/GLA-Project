import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { validatePasswordStrength, generateToken, verifyToken } from '../utils/auth.js';
import { User } from '../models/user.model.js';
import { Role } from '../types/index.js';

describe('Auth Utilities & Security Validators', () => {
  describe('Password Strength Validator', () => {
    it('should reject passwords shorter than 8 characters', () => {
      const res = validatePasswordStrength('Pass1!');
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('at least 8 characters');
    });

    it('should reject passwords missing uppercase letters', () => {
      const res = validatePasswordStrength('lowercase123!');
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('uppercase letter');
    });

    it('should reject passwords missing lowercase letters', () => {
      const res = validatePasswordStrength('UPPERCASE123!');
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('lowercase letter');
    });

    it('should reject passwords missing numeric digits', () => {
      const res = validatePasswordStrength('NoNumbersHere!');
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('at least one number');
    });

    it('should reject passwords missing special characters', () => {
      const res = validatePasswordStrength('PlainPassword123');
      expect(res.isValid).toBe(false);
      expect(res.message).toContain('special character');
    });

    it('should accept strong passwords meeting all criteria', () => {
      const res = validatePasswordStrength('BharatCareer#2026');
      expect(res.isValid).toBe(true);
    });
  });

  describe('JWT Token Generation and Verification', () => {
    it('should generate a valid JWT and decode the exact payload', () => {
      const payload = {
        sub: 'user_1234567890',
        email: 'student@district-college.ac.in',
        role: 'STUDENT' as Role,
      };

      const token = generateToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);

      const decoded = verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe(payload.sub);
      expect(decoded?.email).toBe(payload.email);
      expect(decoded?.role).toBe(payload.role);
    });

    it('should return null when verifying a forged or tampered token', () => {
      const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tamperedSignature';
      const result = verifyToken(forgedToken);
      expect(result).toBeNull();
    });
  });

  describe('Student Profile Completion Score Calculation', () => {
    it('should return 0 score for empty student profile', () => {
      const user = new User({
        fullName: 'Aarav Kumar',
        email: 'aarav@test.ac.in',
        passwordHash: 'hash123',
        role: 'STUDENT',
        studentProfile: {},
      });

      expect(user.calculateStudentScore()).toBe(0);
    });

    it('should calculate accurate weighted completion score as fields are populated', () => {
      const user = new User({
        fullName: 'Priya Sharma',
        email: 'priya@test.ac.in',
        passwordHash: 'hash123',
        role: 'STUDENT',
        studentProfile: {
          collegeName: 'Govt College of Technology, Salem', // 15%
          course: 'B.Tech Information Technology',           // 15%
          educationLevel: 'Undergraduate',                    // 10%
          graduationYear: 2026,                               // 10%
          skills: ['JavaScript', 'React', 'Node.js'],         // 20%
          careerInterests: ['Full Stack Developer'],          // 15%
          preferredWorkLocation: ['Bengaluru', 'Chennai'],    // 15%
        },
      });

      // Sum: 15 + 15 + 10 + 10 + 20 + 15 + 15 = 100%
      expect(user.calculateStudentScore()).toBe(100);
    });
  });
});

describe('Authentication & Profile API Endpoint Contracts', () => {
  const app = createApp();

  describe('Registration Input Validation (Pre-Database)', () => {
    it('should reject registration missing full name with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          role: 'STUDENT',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with invalid email format with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          email: 'not-an-email',
          password: 'Password123!',
          role: 'STUDENT',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with invalid or unsupported role with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Hacker User',
          email: 'admin@example.com',
          password: 'Password123!',
          role: 'ADMIN', // Not in STUDENT, EMPLOYER, COLLEGE
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ROLE');
    });

    it('should reject registration with weak password with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Test User',
          email: 'user@example.com',
          password: 'weak',
          role: 'STUDENT',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('WEAK_PASSWORD');
    });
  });

  describe('Protected Endpoints & Missing Authentication', () => {
    it('GET /api/auth/me should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/users/me should return 401 when invalid Bearer token is provided', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid_bogus_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_TOKEN');
    });

    it('POST /api/auth/logout should clear session and return 200', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Logged out');
    });
  });

  describe('Profile Update Security & Privilege Escalation Prevention', () => {
    it('PATCH /api/users/me should reject role modification attempts with 400', async () => {
      const studentToken = generateToken({
        sub: '507f1f77bcf86cd799439011',
        email: 'student@example.com',
        role: 'STUDENT',
      });

      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          role: 'EMPLOYER', // Attempting privilege escalation
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROLE_MODIFICATION_PROHIBITED');
    });

    it('PATCH /api/users/me should reject attempts to modify protected immutable fields', async () => {
      const studentToken = generateToken({
        sub: '507f1f77bcf86cd799439011',
        email: 'student@example.com',
        role: 'STUDENT',
      });

      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          email: 'newemail@example.com', // Attempting to change email
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROTECTED_FIELD_MODIFICATION');
    });
  });

  describe('Rate Limiting on Authentication Endpoints', () => {
    it('should include standard rate-limiting headers on auth endpoints', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.headers).toHaveProperty('ratelimit-limit');
      expect(res.headers).toHaveProperty('ratelimit-remaining');
    });
  });
});
