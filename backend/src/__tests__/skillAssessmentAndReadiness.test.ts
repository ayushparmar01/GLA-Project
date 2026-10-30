import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import { AssessmentEvaluationService } from '../services/assessmentEvaluation.service.js';
import { CareerReadinessService } from '../services/careerReadiness.service.js';
import { SkillGapService } from '../services/skillGap.service.js';
import { OpportunityMatchingService } from '../services/opportunityMatching.service.js';
import { SEED_ASSESSMENTS } from '../config/skillTaxonomy.seed.js';
import { IUser } from '../models/user.model.js';
import { IPlacementDrive } from '../models/placementDrive.model.js';
import { IAssessment } from '../models/assessment.model.js';

describe('Phase 6: Skill Assessment, Career Readiness & Explainable Opportunity Matching', () => {
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

  describe('1. Skill Taxonomy API', () => {
    it('should retrieve list of skill categories', async () => {
      const res = await request(app).get('/api/skills/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toContain('Programming Languages');
      expect(res.body.data).toContain('Data Structures and Algorithms');
      expect(res.body.data).toContain('Web Development');
      expect(res.body.data).toContain('Databases');
      expect(res.body.data).toContain('Cloud Computing');
    });

    it('should retrieve skills and support category filtering', async () => {
      const res = await request(app).get('/api/skills?category=Web Development');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const skill of res.body.data) {
        expect(skill.category).toBe('Web Development');
      }
    });

    it('should filter skills by search keyword', async () => {
      const res = await request(app).get('/api/skills?search=Python');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((s: { name: string }) => s.name === 'Python')).toBe(true);
    });
  });

  describe('2. Assessment Security & Question Sanitization', () => {
    it('should list assessments without exposing correct answers or explanations', async () => {
      const res = await request(app).get('/api/assessments');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const firstAsm = res.body.data[0];
      expect(firstAsm).toHaveProperty('id');
      expect(firstAsm).toHaveProperty('title');
      expect(firstAsm).toHaveProperty('skillsTested');
      expect(firstAsm).toHaveProperty('durationMinutes');

      if (firstAsm.questions && firstAsm.questions.length > 0) {
        for (const q of firstAsm.questions) {
          expect(q).not.toHaveProperty('correctAnswers');
          expect(q).not.toHaveProperty('explanation');
        }
      }
    });

    it('should sanitize questions when getting single assessment by ID', async () => {
      const res = await request(app).get('/api/assessments/asm-js-web-dev');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('asm-js-web-dev');
      expect(Array.isArray(res.body.data.questions)).toBe(true);

      for (const q of res.body.data.questions) {
        expect(q).not.toHaveProperty('correctAnswers');
        expect(q).not.toHaveProperty('explanation');
        expect(q).toHaveProperty('options');
      }
    });

    it('should return 404 for non-existent assessment', async () => {
      const res = await request(app).get('/api/assessments/asm-nonexistent-999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ASSESSMENT_NOT_FOUND');
    });
  });

  describe('3. Assessment Attempt Lifecycle & Server-Side Scoring', () => {
    let attemptId: string;

    it('should require authentication to start an attempt', async () => {
      const res = await request(app).post('/api/assessments/asm-js-web-dev/attempts');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject non-student roles from taking assessments', async () => {
      const res = await request(app)
        .post('/api/assessments/asm-js-web-dev/attempts')
        .set('Authorization', `Bearer ${employerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow a student to start an assessment attempt', async () => {
      const res = await request(app)
        .post('/api/assessments/asm-js-web-dev/attempts')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.assessmentId).toBe('asm-js-web-dev');

      attemptId = res.body.data.id;
    });

    it('should autosave answers incrementally during the attempt', async () => {
      const res = await request(app)
        .patch(`/api/assessments/asm-js-web-dev/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          answers: {
            'q1-js-eventloop': ['opt-b'],
            'q2-react-hooks': ['opt-a', 'opt-c', 'opt-d'],
          },
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.answers['q1-js-eventloop']).toEqual(['opt-b']);
    });

    it('should evaluate answers server-side on submission and produce results', async () => {
      const res = await request(app)
        .post(`/api/assessments/asm-js-web-dev/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          answers: {
            'q1-js-eventloop': ['opt-b'], // Correct: 4 marks
            'q2-react-hooks': ['opt-a', 'opt-c', 'opt-d'], // Correct: 5 marks
            'q3-rest-idempotency': ['opt-a', 'opt-c', 'opt-d'], // Correct: 4 marks
            'q4-node-debugging': ['opt-a'], // Correct: 4 marks
            'q5-ts-conceptual': ['opt-b'], // Correct: 3 marks
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.score).toBe(20);
      expect(res.body.data.percentage).toBe(100);
      expect(res.body.data.passed).toBe(true);
      expect(Array.isArray(res.body.data.questionEvaluations)).toBe(true);
      expect(res.body.data.questionEvaluations.length).toBe(5);

      // Verify explanations are now revealed in the evaluated result
      expect(res.body.data.questionEvaluations[0]).toHaveProperty('explanation');
      expect(res.body.data.questionEvaluations[0].isCorrect).toBe(true);
    });

    it('should reject re-submitting an already submitted attempt', async () => {
      const res = await request(app)
        .post(`/api/assessments/asm-js-web-dev/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: {} });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ATTEMPT_ALREADY_SUBMITTED');
    });

    it('should retrieve student assessment history', async () => {
      const res = await request(app)
        .get('/api/assessments/my-history')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some((a: { id: string }) => a.id === attemptId)).toBe(true);
    });
  });

  describe('4. Assessment Evaluation Service Unit Tests', () => {
    it('should penalize incorrect answers when negativeMarks is configured', () => {
      const seedAsm = SEED_ASSESSMENTS[0]; // q1: marks 4, negativeMarks 1
      const fakeAssessment = {
        category: seedAsm.category,
        durationMinutes: seedAsm.durationMinutes,
        passingPercentage: seedAsm.passingPercentage,
        questions: [seedAsm.questions[0]], // Only q1
      } as unknown as IAssessment;

      // Select wrong answer 'opt-a'
      const result = AssessmentEvaluationService.evaluate(
        fakeAssessment,
        { 'q1-js-eventloop': ['opt-a'] },
        new Date()
      );

      // Score should not drop below 0
      expect(result.score).toBe(0);
      expect(result.questionEvaluations[0].isCorrect).toBe(false);
      expect(result.questionEvaluations[0].marksAwarded).toBe(-1);
    });

    it('should flag an attempt as expired if submitted after duration + grace period', () => {
      const seedAsm = SEED_ASSESSMENTS[0]; // duration 25 mins
      const fakeAssessment = {
        category: seedAsm.category,
        durationMinutes: 25,
        passingPercentage: 60,
        questions: seedAsm.questions,
      } as unknown as IAssessment;

      // Started 40 minutes ago
      const startedAt = new Date(Date.now() - 40 * 60 * 1000);
      const result = AssessmentEvaluationService.evaluate(
        fakeAssessment,
        {},
        startedAt,
        new Date()
      );

      expect(result.isExpired).toBe(true);
    });
  });

  describe('5. Career Readiness Score Engine', () => {
    const mockStudent: IUser = {
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Vikram Sharma',
      email: 'vikram@district.edu.in',
      role: 'STUDENT',
      studentProfile: {
        headline: 'Full-Stack Web Developer & Open Source Contributor',
        careerObjective: 'Aspiring software engineer looking to build scalable web applications.',
        course: 'Computer Science and Engineering',
        graduationYear: 2025,
        cgpa: 8.8,
        collegeName: 'Government Engineering College',
        technicalSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL & Relational Design'],
        softSkills: ['Analytical Thinking', 'Problem Solving'],
        projects: [
          {
            id: 'proj-1',
            title: 'Rural E-Commerce System',
            description: 'Scalable MERN stack application for local farmers.',
            technologies: ['React', 'Node.js', 'MongoDB'],
            githubUrl: 'https://github.com/vikram/rural-ecom',
            visibility: 'PUBLIC',
          },
          {
            id: 'proj-2',
            title: 'DevOps Automated Pipeline',
            description: 'Docker containerization and CI/CD pipeline.',
            technologies: ['Docker', 'GitHub Actions'],
            liveDemoUrl: 'https://pipeline.demo.in',
            visibility: 'PUBLIC',
          },
        ],
        certifications: [
          {
            id: 'cert-1',
            title: 'AWS Certified Cloud Practitioner',
            issuer: 'Amazon Web Services',
          },
        ],
      },
    } as unknown as IUser;

    it('should compute career readiness with 6 explainable factors summing to 100%', async () => {
      const report = await CareerReadinessService.calculateReadiness(
        mockStudent,
        [
          {
            skillWiseResults: [
              { skill: 'JavaScript', percentage: 80, score: 8, maxScore: 10, totalQuestions: 3, correctQuestions: 2 },
              { skill: 'React', percentage: 90, score: 9, maxScore: 10, totalQuestions: 3, correctQuestions: 3 },
            ],
          } as unknown as any,
          {
            skillWiseResults: [
              { skill: 'Node.js', percentage: 75, score: 6, maxScore: 8, totalQuestions: 2, correctQuestions: 2 },
            ],
          } as unknown as any,
        ],
        true // hasResume = true
      );

      expect(report.factors.length).toBe(6);
      const totalWeight = report.factors.reduce((sum, f) => sum + f.weight, 0);
      expect(totalWeight).toBe(100);

      expect(report.overallScore).toBeGreaterThanOrEqual(80);
      expect(report.statusBand).toBe('HIGHLY_JOB_READY');
      expect(report.assessmentVerifiedSkillsCount).toBeGreaterThanOrEqual(2);
      expect(report.disclaimer).toContain('does not guarantee employment');
    });

    it('should return career readiness report via API for authenticated student', async () => {
      const res = await request(app)
        .get('/api/students/me/career-readiness')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overallScore');
      expect(res.body.data).toHaveProperty('statusBand');
      expect(res.body.data).toHaveProperty('factors');
      expect(res.body.data).toHaveProperty('disclaimer');
    });
  });

  describe('6. Skill Gap Analysis Service & API', () => {
    const mockStudent: IUser = {
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Aarav Patel',
      email: 'aarav@district.edu.in',
      role: 'STUDENT',
      studentProfile: {
        technicalSkills: ['JavaScript', 'React'],
      },
    } as unknown as IUser;

    const mockDrive: IPlacementDrive = {
      _id: 'drive-test-123',
      title: 'Senior Frontend Engineer Drive',
      organizationName: 'Innovate Bharat',
      requiredSkills: ['JavaScript', 'React', 'TypeScript', 'Docker'],
      preferredSkills: ['Node.js'],
    } as unknown as IPlacementDrive;

    it('should correctly identify self-declared vs missing skills and generate learning path', async () => {
      const report = await SkillGapService.analyzeSkillGap(mockStudent, mockDrive);

      expect(report.driveTitle).toBe('Senior Frontend Engineer Drive');
      expect(report.requiredSkillsCount).toBe(4);
      expect(report.matchedSkillsCount).toBe(2); // JavaScript, React
      expect(report.missingSkillsCount).toBe(2); // TypeScript, Docker
      expect(report.matchPercentage).toBe(50);

      const jsSkill = report.skills.find((s) => s.skill === 'JavaScript');
      expect(jsSkill?.status).toBe('SELF_DECLARED');

      const dockerSkill = report.skills.find((s) => s.skill === 'Docker');
      expect(dockerSkill?.status).toBe('MISSING');
      expect(dockerSkill?.suggestedAssessmentId).toBeDefined();

      expect(report.learningPath.length).toBeGreaterThan(0);
    });

    it('should return skill gap analysis via API', async () => {
      const res = await request(app)
        .get('/api/students/me/skill-gaps')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('matchPercentage');
      expect(res.body.data).toHaveProperty('skills');
      expect(res.body.data).toHaveProperty('learningPath');
    });
  });

  describe('7. Smart Opportunity Matching Service & API', () => {
    const mockStudent: IUser = {
      _id: '507f1f77bcf86cd799439011',
      fullName: 'Pooja Verma',
      email: 'pooja@district.edu.in',
      role: 'STUDENT',
      studentProfile: {
        headline: 'Web Developer',
        course: 'Computer Science',
        graduationYear: 2025,
        cgpa: 8.5,
        technicalSkills: ['JavaScript', 'React', 'Node.js'],
      },
    } as unknown as IUser;

    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const eligibleDrive: IPlacementDrive = {
      _id: 'drive-eligible-1',
      title: 'Full Stack Engineer (2025)',
      description: 'Exciting full stack role',
      organizationName: 'TechCorp Bharat',
      opportunityType: 'JOB',
      workMode: 'REMOTE',
      status: 'PUBLISHED',
      applicationDeadline: futureDate,
      eligibleCourses: ['Computer Science'],
      eligibleGraduationYears: [2025],
      requiredSkills: ['JavaScript', 'React'],
      minimumCGPA: 7.0,
      toSafeObject: () => ({
        id: 'drive-eligible-1',
        title: 'Full Stack Engineer (2025)',
        description: 'Exciting full stack role',
        organizationName: 'TechCorp Bharat',
        opportunityType: 'JOB',
        workMode: 'REMOTE',
        status: 'PUBLISHED',
        applicationDeadline: futureDate.toISOString(),
        eligibleCourses: ['Computer Science'],
        eligibleGraduationYears: [2025],
        requiredSkills: ['JavaScript', 'React'],
        minimumCGPA: 7.0,
        createdBy: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    } as unknown as IPlacementDrive;

    const expiredDrive: IPlacementDrive = {
      _id: 'drive-expired-2',
      title: 'Expired Frontend Internship',
      description: 'Internship role',
      organizationName: 'OldCorp',
      opportunityType: 'INTERNSHIP',
      workMode: 'ONSITE',
      status: 'PUBLISHED',
      applicationDeadline: pastDate,
      toSafeObject: () => ({
        id: 'drive-expired-2',
        title: 'Expired Frontend Internship',
        description: 'Internship role',
        organizationName: 'OldCorp',
        opportunityType: 'INTERNSHIP',
        workMode: 'ONSITE',
        status: 'PUBLISHED',
        applicationDeadline: pastDate.toISOString(),
        createdBy: 'user-2',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    } as unknown as IPlacementDrive;

    it('should accurately categorize drives into eligible and ineligible while preserving Phase 3 eligibility', async () => {
      const report = await OpportunityMatchingService.matchOpportunities(mockStudent, [
        eligibleDrive,
        expiredDrive,
      ]);

      expect(report.eligibleOpportunities.length).toBe(1);
      expect(report.eligibleOpportunities[0].drive.id).toBe('drive-eligible-1');
      expect(report.eligibleOpportunities[0].isEligible).toBe(true);
      expect(report.eligibleOpportunities[0].matchScore).toBeGreaterThanOrEqual(55);

      expect(report.ineligibleOpportunities.length).toBe(1);
      expect(report.ineligibleOpportunities[0].drive.id).toBe('drive-expired-2');
      expect(report.ineligibleOpportunities[0].isEligible).toBe(false);
      expect(report.ineligibleOpportunities[0].eligibility.missingRequirements).toContain('Deadline Passed');
    });

    it('should return recommended opportunities via API', async () => {
      const res = await request(app)
        .get('/api/students/me/recommended-opportunities')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('eligibleOpportunities');
      expect(res.body.data).toHaveProperty('potentialMatches');
      expect(res.body.data).toHaveProperty('ineligibleOpportunities');
      expect(res.body.data).toHaveProperty('studentReadinessScore');
    });
  });
});
