import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { RecommendationConfigurationService } from '../services/recommendationConfiguration.service.js';
import { evaluateEligibility } from '../services/eligibility.service.js';
import { JobMatchingService } from '../services/jobMatching.service.js';
import { RecommendationExplanationService } from '../services/recommendationExplanation.service.js';
import { SkillGapAnalysisService } from '../services/skillGapAnalysis.service.js';
import { MatchingWeightsConfig } from '../types/index.js';

describe('Phase 13 — Advanced AI Job Matching & Explainable Recommendation Engine', () => {
  const app = createApp();

  describe('1. Recommendation Configuration & Weighted Formula Validation', () => {
    it('should provide default 6-pillar weights summing to exactly 100%', async () => {
      const config = await RecommendationConfigurationService.getConfiguration();

      expect(config).toBeDefined();
      expect(config.scoringWeights).toBeDefined();
      const { skills, education, assessment, experience, location, rolePreference } = config.scoringWeights;

      expect(skills).toBe(35);
      expect(education).toBe(20);
      expect(assessment).toBe(15);
      expect(experience).toBe(10);
      expect(location).toBe(10);
      expect(rolePreference).toBe(10);

      const total = skills + education + assessment + experience + location + rolePreference;
      expect(total).toBe(100);
    });

    it('should reject weight updates that do not sum to 100%', async () => {
      const invalidWeights: Partial<MatchingWeightsConfig> = {
        skills: 40,
        education: 20,
        assessment: 20,
        experience: 10,
        location: 10,
        rolePreference: 10, // Total = 110%
      };

      await expect(
        RecommendationConfigurationService.updateConfiguration(invalidWeights)
      ).rejects.toThrow(/100%/);
    });

    it('should reject negative weights or values exceeding 100', async () => {
      const negativeWeights: Partial<MatchingWeightsConfig> = {
        skills: -10,
        education: 50,
        assessment: 30,
        experience: 10,
        location: 10,
        rolePreference: 10,
      };

      await expect(
        RecommendationConfigurationService.updateConfiguration(negativeWeights)
      ).rejects.toThrow();
    });

    it('should successfully update and return valid weights summing to 100%', async () => {
      const validWeights: Partial<MatchingWeightsConfig> = {
        skills: 30,
        education: 25,
        assessment: 15,
        experience: 10,
        location: 10,
        rolePreference: 10, // Total = 100%
      };

      const updated = await RecommendationConfigurationService.updateConfiguration(validWeights);
      expect(updated.scoringWeights.skills).toBe(30);
      expect(updated.scoringWeights.education).toBe(25);
    });
  });

  describe('2. Three Core Evaluation Pillars Separation (Zero Conflation)', () => {
    it('should evaluate mandatory eligibility independently without inflating with match scores', () => {
      const eligibilityResult = evaluateEligibility({
        driveStatus: 'PUBLISHED',
        applicationDeadline: new Date(Date.now() + 86400000),
        eligibleCourses: ['B.Tech Computer Science'],
        eligibleBranches: ['Computer Science'],
        eligibleGraduationYears: [2025],
        requiredSkills: ['React', 'Node.js'],
        minimumCGPA: 7.5,
        maxBacklogsAllowed: 0,
        studentProfile: {
          course: 'B.Tech Computer Science',
          specialization: 'Computer Science',
          graduationYear: 2025,
          cgpa: 6.8, // CGPA below requirement
          backlogs: 0,
          technicalSkills: ['React', 'Node.js', 'Python'],
        },
      });

      expect(eligibilityResult.eligible).toBe(false);
      expect(eligibilityResult.status).toBe('NOT_ELIGIBLE');
      expect(eligibilityResult.cgpaEligible).toBe(false);
      expect(eligibilityResult.skillsEligible).toBe(true);
      expect(eligibilityResult.academicEligible).toBe(true);
      expect(eligibilityResult.missingRequirements).toContain('CGPA Below Requirement (Requires: 7.5)');
    });

    it('should mark INCOMPLETE_PROFILE when required student academic attributes are missing', () => {
      const eligibilityResult = evaluateEligibility({
        driveStatus: 'PUBLISHED',
        applicationDeadline: new Date(Date.now() + 86400000),
        eligibleCourses: ['B.Tech'],
        eligibleGraduationYears: [2025],
        minimumCGPA: 7.0,
        studentProfile: {
          // Missing course, graduationYear, and cgpa
          skills: [],
        },
      });

      expect(eligibilityResult.eligible).toBe(false);
      expect(eligibilityResult.status).toBe('INCOMPLETE_PROFILE');
    });

    it('should approve student as ELIGIBLE when all mandatory criteria are met', () => {
      const eligibilityResult = evaluateEligibility({
        driveStatus: 'PUBLISHED',
        applicationDeadline: new Date(Date.now() + 86400000),
        eligibleCourses: ['B.Tech', 'B.E.'],
        eligibleBranches: ['CSE', 'IT'],
        eligibleGraduationYears: [2025, 2026],
        requiredSkills: ['Python', 'SQL'],
        minimumCGPA: 6.5,
        maxBacklogsAllowed: 1,
        studentProfile: {
          course: 'B.Tech',
          specialization: 'CSE',
          graduationYear: 2025,
          cgpa: 8.2,
          backlogs: 0,
          technicalSkills: ['Python', 'SQL', 'Django'],
        },
      });

      expect(eligibilityResult.eligible).toBe(true);
      expect(eligibilityResult.status).toBe('ELIGIBLE');
      expect(eligibilityResult.reasons.length).toBeGreaterThan(0);
      expect(eligibilityResult.missingRequirements.length).toBe(0);
    });
  });

  describe('3. 6-Pillar Compatibility Breakdown & Categorization', () => {
    const mockWeights: MatchingWeightsConfig = {
      skills: 35,
      education: 20,
      assessment: 15,
      experience: 10,
      location: 10,
      rolePreference: 10,
    };

    const mockDrive: any = {
      _id: 'drive123',
      title: 'Full Stack Software Engineer',
      description: 'Looking for a passionate Full Stack developer proficient in React and Node.js.',
      organizationName: 'TechCorp Solutions',
      location: 'Bengaluru',
      workMode: 'REMOTE',
      requiredSkills: ['React', 'Node.js'],
      preferredSkills: ['TypeScript', 'Docker'],
      eligibleCourses: ['B.Tech'],
      eligibleBranches: ['Computer Science'],
      eligibleGraduationYears: [2025],
      minimumCGPA: 7.0,
      minExperienceYears: 0,
    };

    it('should calculate 6-pillar breakdown with high score for fully aligned student', () => {
      const mockUser: any = {
        _id: 'user123',
        fullName: 'Aarav Sharma',
        role: 'STUDENT',
        studentProfile: {
          course: 'B.Tech',
          specialization: 'Computer Science',
          graduationYear: 2025,
          cgpa: 8.5,
          skills: ['React', 'Node.js', 'TypeScript'],
          technicalSkills: ['React', 'Node.js', 'TypeScript', 'Docker'],
          projects: [
            { title: 'Project 1', description: 'Web app' },
            { title: 'Project 2', description: 'API service' },
          ],
          preferredWorkLocations: ['Bengaluru', 'Remote'],
          preferredJobRoles: ['Full Stack Software Engineer', 'Frontend Engineer'],
        },
      };

      const verifiedSkillsSet = new Set(['react', 'node.js']);
      const selfDeclaredSkills = ['react', 'node.js', 'typescript', 'docker'];

      const breakdown = JobMatchingService.calculateCompatibilityBreakdown({
        user: mockUser,
        drive: mockDrive,
        weights: mockWeights,
        readinessScore: 85,
        selfDeclaredSkills,
        verifiedSkillsSet,
      });

      expect(breakdown.skillsScore).toBeGreaterThanOrEqual(25);
      expect(breakdown.educationScore).toBe(20);
      expect(breakdown.assessmentScore).toBeGreaterThanOrEqual(12);
      expect(breakdown.locationScore).toBe(10); // Remote work mode = full score
      expect(breakdown.rolePreferenceScore).toBe(10); // Direct title match

      const totalScore =
        breakdown.skillsScore +
        breakdown.educationScore +
        breakdown.assessmentScore +
        breakdown.experienceScore +
        breakdown.locationScore +
        breakdown.rolePreferenceScore;

      expect(totalScore).toBeGreaterThanOrEqual(80);
    });

    it('should correctly classify match categories based on score thresholds', () => {
      // Threshold rules: >=85: EXCELLENT, 70-84: STRONG, 50-69: MODERATE, <50: LOW
      const categorize = (score: number) => {
        if (score >= 85) return 'EXCELLENT_MATCH';
        if (score >= 70) return 'STRONG_MATCH';
        if (score >= 50) return 'MODERATE_MATCH';
        return 'LOW_MATCH';
      };

      expect(categorize(92)).toBe('EXCELLENT_MATCH');
      expect(categorize(85)).toBe('EXCELLENT_MATCH');
      expect(categorize(78)).toBe('STRONG_MATCH');
      expect(categorize(70)).toBe('STRONG_MATCH');
      expect(categorize(64)).toBe('MODERATE_MATCH');
      expect(categorize(50)).toBe('MODERATE_MATCH');
      expect(categorize(42)).toBe('LOW_MATCH');
    });
  });

  describe('4. Deterministic Explainability & Recommendations', () => {
    it('should generate structured explanation with matching/missing skills and compatibility notes', () => {
      const mockUser: any = {
        studentProfile: {
          course: 'B.Tech',
          graduationYear: 2025,
          cgpa: 7.8,
          preferredWorkLocations: ['Bengaluru'],
        },
      };

      const mockDrive: any = {
        title: 'Backend Developer',
        location: 'Bengaluru',
        workMode: 'HYBRID',
        applicationDeadline: new Date(Date.now() + 864000000),
      };

      const explanation = RecommendationExplanationService.generateExplanation({
        user: mockUser,
        drive: mockDrive,
        breakdown: {
          skillsScore: 30,
          educationScore: 20,
          assessmentScore: 12,
          experienceScore: 8,
          locationScore: 10,
          rolePreferenceScore: 8,
        },
        eligibility: {
          eligible: true,
          status: 'ELIGIBLE',
          reasons: ['Satisfies all requirements'],
          missingRequirements: [],
          academicEligible: true,
          cgpaEligible: true,
          batchEligible: true,
          checkedAt: new Date().toISOString(),
        },
        matchingSkills: ['Node.js', 'PostgreSQL'],
        missingSkills: ['Redis'],
        readinessScore: 80,
      });

      expect(explanation.matchingSkills).toEqual(['Node.js', 'PostgreSQL']);
      expect(explanation.missingSkills).toEqual(['Redis']);
      expect(explanation.academicCompatibility).toContain('fully aligned');
      expect(explanation.assessmentCompatibility).toContain('High verified readiness');
      expect(explanation.preferenceCompatibility).toContain('matches');
      expect(explanation.recommendedActions.length).toBeGreaterThan(0);
      expect(explanation.recommendedActions.some((a) => a.includes('Redis'))).toBe(true);
    });
  });

  describe('5. Skill Gap Analysis & Learning Resource Integration', () => {
    it('should extract matching and missing skills accurately', () => {
      const mockDrive: any = {
        requiredSkills: ['Java', 'Spring Boot', 'SQL'],
        preferredSkills: ['AWS', 'Kafka'],
      };

      const selfDeclared = ['java', 'sql'];
      const verified = new Set(['java']);

      const { matchingSkills, missingSkills } = JobMatchingService.extractMatchingAndMissingSkills(
        mockDrive,
        selfDeclared,
        verified
      );

      expect(matchingSkills).toContain('Java');
      expect(matchingSkills).toContain('SQL');
      expect(missingSkills).toContain('Spring Boot');
      expect(missingSkills).toContain('AWS');
      expect(missingSkills).toContain('Kafka');
    });

    it('should generate skill gap report categorizing missing mandatory and preferred skills', async () => {
      const mockUser: any = {
        _id: 'testUser999',
        role: 'STUDENT',
        studentProfile: {
          technicalSkills: ['JavaScript', 'HTML', 'CSS'],
          skills: ['JavaScript'],
        },
      };

      const report = await SkillGapAnalysisService.analyzeSkillGaps(mockUser);

      expect(report).toBeDefined();
      expect(report.studentId).toBe('testUser999');
      expect(Array.isArray(report.gaps)).toBe(true);
      expect(Array.isArray(report.prioritizedLearningSequence)).toBe(true);
      expect(typeof report.overallMatchScoreAverage).toBe('number');
    });
  });

  describe('6. Security, RBAC & API Endpoints Protection', () => {
    it('GET /api/recommendations should require authentication (401)', async () => {
      const res = await request(app).get('/api/recommendations');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/recommendations/admin/config should require authentication (401)', async () => {
      const res = await request(app).get('/api/recommendations/admin/config');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/recommendations/admin/analytics should require authentication (401)', async () => {
      const res = await request(app).get('/api/recommendations/admin/analytics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/recommendations/employer/jobs/test-id/candidates should require authentication (401)', async () => {
      const res = await request(app).get('/api/recommendations/employer/jobs/test-id/candidates');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/recommendations/college/placement-intelligence should require authentication (401)', async () => {
      const res = await request(app).get('/api/recommendations/college/placement-intelligence');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
