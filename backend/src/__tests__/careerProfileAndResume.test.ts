import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import { generateResumePdf } from '../services/pdfGenerator.service.js';
import { calculateProfileCompletion } from '../services/profileCompletion.service.js';
import { User, IUser } from '../models/user.model.js';
import { ResumeData, ResumeStructuredContent } from '../types/index.js';

describe('Phase 5: Career Profile, Resume Builder & Portfolio', () => {
  const app = createApp();

  const studentToken = generateToken({
    sub: '507f1f77bcf86cd799439011',
    email: 'student@district.edu.in',
    role: 'STUDENT',
  });

  const employerToken = generateToken({
    sub: '507f1f77bcf86cd799439022',
    email: 'recruiter@techcorp.in',
    role: 'EMPLOYER',
  });

  const collegeToken = generateToken({
    sub: '507f1f77bcf86cd799439033',
    email: 'dean@district.edu.in',
    role: 'COLLEGE',
  });

  describe('1. Role-Based Access Control & Route Guarding', () => {
    it('should reject unauthenticated requests to career profile with 401', async () => {
      const res = await request(app).get('/api/students/me/career-profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject non-student accounts from accessing career profile with 403', async () => {
      const employerRes = await request(app)
        .get('/api/students/me/career-profile')
        .set('Authorization', `Bearer ${employerToken}`);
      expect(employerRes.status).toBe(403);
      expect(employerRes.body.error.code).toBe('FORBIDDEN');

      const collegeRes = await request(app)
        .get('/api/students/me/career-profile')
        .set('Authorization', `Bearer ${collegeToken}`);
      expect(collegeRes.status).toBe(403);
      expect(collegeRes.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject non-student accounts from creating portfolio projects with 403', async () => {
      const res = await request(app)
        .post('/api/students/me/projects')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ title: 'Invalid Project', description: 'Sample description' });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject non-student accounts from creating resumes with 403', async () => {
      const res = await request(app)
        .post('/api/students/me/resumes')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({ title: 'My Resume' });
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should reject non-employer accounts from downloading candidate resumes with 403', async () => {
      const res = await request(app)
        .get('/api/employers/applications/507f1f77bcf86cd799439044/resume')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('2. Career Profile Validation Rules', () => {
    it('should reject invalid GitHub URL format', async () => {
      const res = await request(app)
        .patch('/api/students/me/career-profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ githubUrl: 'not_a_valid_url' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('GitHub URL');
    });

    it('should reject invalid LinkedIn URL format', async () => {
      const res = await request(app)
        .patch('/api/students/me/career-profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ linkedinUrl: 'htp://invalid-link' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('LinkedIn URL');
    });

    it('should reject invalid workModePreference values', async () => {
      const res = await request(app)
        .patch('/api/students/me/career-profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ workModePreference: 'COFFEE_SHOP' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Work mode preference');
    });

    it('should reject headlines exceeding 150 characters', async () => {
      const res = await request(app)
        .patch('/api/students/me/career-profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ headline: 'A'.repeat(151) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Headline cannot exceed');
    });
  });

  describe('3. Project Portfolio Validations', () => {
    it('should reject project without a title or with a 1-character title', async () => {
      const res = await request(app)
        .post('/api/students/me/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'A', description: 'Valid project description that is long enough.' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Project title is required');
    });

    it('should reject project with description shorter than 10 characters', async () => {
      const res = await request(app)
        .post('/api/students/me/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'AgriTech IoT Monitor', description: 'Too short' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Project description is required');
    });

    it('should reject project with malformed repository or demo URLs', async () => {
      const res = await request(app)
        .post('/api/students/me/projects')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Smart Solar Inverter',
          description: 'Microcontroller-driven solar tracker and power inverter system.',
          githubUrl: 'git@github.com:student/repo',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Invalid GitHub URL');
    });
  });

  describe('4. Resume Builder Validations', () => {
    it('should reject resume creation without title', async () => {
      const res = await request(app)
        .post('/api/students/me/resumes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          template: 'MODERN',
          structuredContent: { personalInfo: { fullName: 'Aarav Kumar', email: 'aarav@test.ac.in' } },
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Resume title is required');
    });

    it('should reject unsupported resume template', async () => {
      const res = await request(app)
        .post('/api/students/me/resumes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Software Developer Resume',
          template: 'NEON_CYBERPUNK',
          structuredContent: { personalInfo: { fullName: 'Aarav Kumar', email: 'aarav@test.ac.in' } },
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Template must be MODERN, PROFESSIONAL, or MINIMAL');
    });

    it('should reject resume with missing structured content', async () => {
      const res = await request(app)
        .post('/api/students/me/resumes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Software Developer Resume',
          template: 'PROFESSIONAL',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Resume structured content is required');
    });

    it('should reject invalid resume ID format in download endpoint', async () => {
      const res = await request(app)
        .get('/api/students/me/resumes/not-a-valid-object-id/download')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('Invalid resume ID format');
    });
  });

  describe('5. PDF Generator Service (ATS Templates)', () => {
    const mockStructuredContent: ResumeStructuredContent = {
      personalInfo: {
        fullName: 'Devansh Patil',
        email: 'devansh.patil@rural-eng.ac.in',
        phoneNumber: '+91 98765 43210',
        location: 'Kolhapur, Maharashtra',
        headline: 'Full-Stack Developer & Embedded Systems Enthusiast',
        githubUrl: 'https://github.com/devansh-patil',
        linkedinUrl: 'https://linkedin.com/in/devansh-patil',
        portfolioUrl: 'https://devansh-patil.dev',
        summary:
          'Passionate B.Tech student with strong foundation in TypeScript, Node.js, and IoT systems, eager to solve real-world industrial automation problems.',
      },
      education: [
        {
          institution: 'Government College of Engineering, Karad',
          degree: 'B.Tech',
          fieldOfStudy: 'Computer Science and Engineering',
          startYear: 2022,
          endYear: 2026,
          cgpa: 8.85,
        },
      ],
      technicalSkills: ['TypeScript', 'Node.js', 'React', 'MongoDB', 'Docker', 'C++'],
      softSkills: ['Analytical Problem Solving', 'Cross-Functional Teamwork', 'Fast Learner'],
      projects: [
        {
          id: 'proj_01',
          title: 'AgroBridge Soil Quality Telemetry',
          description:
            'Engineered an offline-first IoT sensing network monitoring soil moisture, pH, and nitrogen levels for smallholder farmers.',
          technologies: ['C++', 'MQTT', 'Node.js', 'React'],
          role: 'Lead Architect',
          githubUrl: 'https://github.com/devansh-patil/agrobridge',
          visibility: 'PUBLIC',
        },
      ],
      experience: [
        {
          id: 'exp_01',
          title: 'Embedded Firmware Intern',
          company: 'KrishiTech Automation Labs',
          location: 'Pune, Maharashtra',
          startDate: 'May 2025',
          endDate: 'July 2025',
          description:
            'Developed low-power firmware routines reducing sensor telemetry power consumption by 32%.',
        },
      ],
      certifications: [
        {
          id: 'cert_01',
          title: 'AWS Certified Cloud Practitioner',
          issuer: 'Amazon Web Services',
          issueDate: 'Jan 2025',
        },
      ],
      achievements: [
        {
          id: 'ach_01',
          title: 'Smart India Hackathon Finalist',
          description: 'Selected in Top 5 from 1,200 teams in Rural Innovation track.',
        },
      ],
      visibleSections: {
        summary: true,
        skills: true,
        education: true,
        projects: true,
        experience: true,
        certifications: true,
        achievements: true,
      },
    };

    it('should generate valid PDF buffer for MODERN ATS template', async () => {
      const mockResume: ResumeData = {
        id: 'res_01',
        studentId: '507f1f77bcf86cd799439011',
        title: 'Full Stack Engineering Resume',
        template: 'MODERN',
        structuredContent: mockStructuredContent,
        version: 1,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const buffer = await generateResumePdf(mockResume);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(500);
      // Valid PDF files begin with '%PDF-' magic bytes
      const header = buffer.subarray(0, 5).toString('utf-8');
      expect(header).toBe('%PDF-');
    });

    it('should generate valid PDF buffer for PROFESSIONAL ATS template', async () => {
      const mockResume: ResumeData = {
        id: 'res_02',
        studentId: '507f1f77bcf86cd799439011',
        title: 'Executive Engineering Resume',
        template: 'PROFESSIONAL',
        structuredContent: mockStructuredContent,
        version: 1,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const buffer = await generateResumePdf(mockResume);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(500);
      expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
    });

    it('should generate valid PDF buffer for MINIMAL ATS template', async () => {
      const mockResume: ResumeData = {
        id: 'res_03',
        studentId: '507f1f77bcf86cd799439011',
        title: 'High-Density ATS Resume',
        template: 'MINIMAL',
        structuredContent: mockStructuredContent,
        version: 1,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const buffer = await generateResumePdf(mockResume);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(500);
      expect(buffer.subarray(0, 5).toString('utf-8')).toBe('%PDF-');
    });
  });

  describe('6. Profile Completion Service & Transparent Scoring', () => {
    it('should return weighted breakdown and honest score for partial profile', async () => {
      const partialUser = new User({
        fullName: 'Sneha Jadhav',
        email: 'sneha@tier3college.ac.in',
        passwordHash: 'dummyHash',
        role: 'STUDENT',
        studentProfile: {
          headline: 'Aspiring Web Developer',
          careerObjective: 'Motivated student seeking entry-level software developer roles.',
          collegeName: 'Shri Shivaji Institute of Technology',
          course: 'B.E. Information Technology',
          graduationYear: 2026,
          technicalSkills: ['JavaScript', 'HTML5', 'CSS3'],
        },
      });

      const report = await calculateProfileCompletion(partialUser as IUser);
      expect(report.score).toBeGreaterThan(0);
      expect(report.score).toBeLessThan(100);
      expect(report.isComplete).toBe(false);
      expect(report.sections).toHaveLength(8);

      // Verify headline & education are marked completed
      const headlineSec = report.sections.find((s) => s.key === 'basic_identity');
      expect(headlineSec?.completed).toBe(true);

      const eduSec = report.sections.find((s) => s.key === 'education');
      expect(eduSec?.completed).toBe(true);

      // Verify missing sections are present in nextSteps
      const projectsSec = report.sections.find((s) => s.key === 'projects');
      expect(projectsSec?.completed).toBe(false);
      expect(report.nextSteps.some((step) => step.toLowerCase().includes('project'))).toBe(true);
    });
  });

  describe('7. Offline Database Resilience (503 Service Unavailable)', () => {
    it('should gracefully return 503 for career profile when database is disconnected', async () => {
      const res = await request(app)
        .get('/api/students/me/career-profile')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });

    it('should gracefully return 503 for profile completion check when database is disconnected', async () => {
      const res = await request(app)
        .get('/api/students/me/profile-completion')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });

    it('should gracefully return 503 for listing resumes when database is disconnected', async () => {
      const res = await request(app)
        .get('/api/students/me/resumes')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });
  });
});
