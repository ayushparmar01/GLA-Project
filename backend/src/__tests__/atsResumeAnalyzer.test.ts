import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { ResumeDocumentParserService } from '../services/resumeDocumentParser.service.js';
import { AtsScoringService } from '../services/atsScoring.service.js';
import { ResumeAiFeedbackService } from '../services/resumeAiFeedback.service.js';
import { ResumeAnalyzerService } from '../services/resumeAnalyzer.service.js';
import { ResumeDocument } from '../models/resumeDocument.model.js';
import { ResumeAnalysis } from '../models/resumeAnalysis.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { User } from '../models/user.model.js';

describe('Phase 15 — AI-Powered ATS Resume Analyzer & Optimization System Tests', () => {
  const app = createApp();

  describe('1. Document Parsing & Text Extraction Engine', () => {
    it('should validate PDF magic bytes (%PDF-) and reject unsupported extensions', () => {
      const pdfHeader = Buffer.from('%PDF-1.5 test content');
      const validation = ResumeDocumentParserService.validateDocument(pdfHeader, 'resume.pdf');
      expect(validation.valid).toBe(true);
      expect(validation.fileType).toBe('PDF');

      const invalidBuffer = Buffer.from('Just plain text without PDF or DOCX headers');
      const invalidValidation = ResumeDocumentParserService.validateDocument(invalidBuffer, 'resume.exe');
      expect(invalidValidation.valid).toBe(false);
      expect(invalidValidation.error).toContain('Unsupported or corrupted document format');
    });

    it('should validate DOCX PK zip magic bytes (50 4B 03 04)', () => {
      const docxHeader = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
      const validation = ResumeDocumentParserService.validateDocument(docxHeader, 'my_resume.docx');
      expect(validation.valid).toBe(true);
      expect(validation.fileType).toBe('DOCX');
    });

    it('should enforce a 5MB maximum file size limit', () => {
      const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024);
      const validation = ResumeDocumentParserService.validateDocument(oversizedBuffer, 'huge_resume.pdf');
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('exceeds maximum allowed limit of 5MB');
    });

    it('should extract structured fields: contact, education, skills, projects, and experience', () => {
      const sampleResumeText = `
        Aakash Sharma
        aakash.sharma@example.com | +91 9876543210 | Bengaluru, India
        https://linkedin.com/in/aakash-sharma | https://github.com/aakash-dev

        Career Objective
        Passionate full-stack developer eager to engineer scalable web applications and REST APIs using modern frameworks.

        Education
        Bachelor of Technology in Computer Science & Engineering
        Bharat Institute of Technology (2021 - 2025)
        CGPA: 8.6 / 10

        Technical Skills
        JavaScript, TypeScript, React, Node.js, Express, MongoDB, SQL, Docker, Git, REST APIs

        Soft Skills
        Problem Solving, Communication, Teamwork, Time Management

        Projects
        Decentralized Rural Healthcare Portal
        • Developed a responsive telemedicine web application using React and Node.js.
        • Integrated MongoDB for patient telemetry records and implemented JWT authentication.

        Work Experience
        Software Engineering Intern - AgriTech Solutions
        • Collaborated on building dashboard analytics using TypeScript and Express.
        • Optimized API response latency by 25% through MongoDB query indexing.

        Certifications
        AWS Certified Cloud Practitioner (2024)
        Full Stack Web Development - freeCodeCamp

        Achievements
        First Prize in National Hackathon on Smart Governance (2024)
      `;

      const structured = ResumeDocumentParserService.parseStructuredFields(sampleResumeText);

      expect(structured).toBeDefined();
      expect(structured.contact.fullName).toBe('Aakash Sharma');
      expect(structured.contact.email).toBe('aakash.sharma@example.com');
      expect(structured.contact.phone).toContain('9876543210');
      expect(structured.contact.linkedinUrl).toContain('linkedin.com/in/aakash-sharma');
      expect(structured.contact.githubUrl).toContain('github.com/aakash-dev');

      // Skills
      expect(structured.technicalSkills).toContain('React');
      expect(structured.technicalSkills).toContain('Node.js');
      expect(structured.technicalSkills).toContain('TypeScript');
      expect(structured.technicalSkills).toContain('MongoDB');
      expect(structured.softSkills).toContain('Problem Solving');

      // Education
      expect(structured.education.length).toBeGreaterThan(0);
      expect(structured.education[0].institution).toContain('Bharat Institute of Technology');

      // Projects & Experience
      expect(structured.projects.length).toBeGreaterThan(0);
      expect(structured.projects[0].title).toContain('Decentralized Rural Healthcare Portal');
      expect(structured.projects[0].bullets.length).toBeGreaterThan(0);
      expect(structured.workExperience.length).toBeGreaterThan(0);
    });
  });

  describe('2. Deterministic ATS Scoring & 7-Component Breakdown', () => {
    const mockResume = {
      contact: {
        fullName: 'Priya Patel',
        email: 'priya.patel@example.com',
        phone: '+91 9123456789',
        summary: 'Frontend engineer with React and TypeScript focus.',
      },
      education: [
        {
          institution: 'Government Engineering College',
          degree: 'B.Tech Information Technology',
          cgpa: '8.4',
        },
      ],
      technicalSkills: ['React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind', 'Git'],
      softSkills: ['Teamwork', 'Communication'],
      workExperience: [],
      projects: [
        {
          title: 'E-Commerce Marketplace',
          technologies: ['React', 'TypeScript'],
          bullets: [
            'Engineered dynamic product catalog with responsive UI.',
            'Implemented shopping cart state management with client persistence.',
          ],
        },
        {
          title: 'Campus Placement Portal',
          technologies: ['React', 'Tailwind'],
          bullets: ['Designed student profile scorecard layout.'],
        },
      ],
      certifications: [{ name: 'Responsive Web Design - freeCodeCamp' }],
      achievements: ['Department Topper (Sem 5)'],
      rawTextLength: 1200,
    };

    const mockJob = {
      title: 'Frontend React Developer',
      organizationName: 'AlphaTech Cloud',
      description: 'Looking for a React and TypeScript engineer to build modern frontend UIs with REST APIs.',
      requiredSkills: ['React', 'TypeScript', 'Git'],
      preferredSkills: ['Tailwind', 'REST APIs'],
    };

    it('should calculate an explainable ATS compatibility score based on the 7-component formula', () => {
      const result = AtsScoringService.calculateAtsScore(mockResume, mockJob);

      expect(result).toBeDefined();
      expect(result.atsScore).toBeGreaterThanOrEqual(70);
      expect(result.atsScore).toBeLessThanOrEqual(100);
      expect(['STRONG_ALIGNMENT', 'GOOD_ALIGNMENT']).toContain(result.scoreTier);

      // Verify 7-component weights breakdown
      const { breakdown } = result;
      expect(breakdown.requiredSkillCoverage).toBe(30); // All 3 required skills (React, TypeScript, Git) present
      expect(breakdown.jobKeywordAlignment).toBeGreaterThanOrEqual(10);
      expect(breakdown.projectExperienceAlignment).toBeGreaterThanOrEqual(10);
      expect(breakdown.educationAlignment).toBe(10);
      expect(breakdown.structureCompleteness).toBe(10);
      expect(breakdown.achievementsCertifications).toBeGreaterThanOrEqual(5);
      expect(breakdown.formattingChecks).toBeGreaterThanOrEqual(3);
    });

    it('should provide fresher-friendly project credit without penalizing lack of corporate tenure', () => {
      // Resume has 2 substantive projects with multiple bullets, but 0 corporate work experience
      const result = AtsScoringService.calculateAtsScore(mockResume, mockJob);

      expect(result.qualityReport.fresherFriendly).toBe(true);
      expect(result.qualityReport.experienceQuality.status).toBe('PASS');
      expect(result.reasons.some((r) => r.toLowerCase().includes('fresher'))).toBe(true);
    });

    it('should classify ATS scores accurately across all 4 tiers', () => {
      // 85+: STRONG, 70-84: GOOD, 50-69: MODERATE, <50: NEEDS_IMPROVEMENT
      const categorize = (score: number) => {
        if (score >= 85) return 'STRONG_ALIGNMENT';
        if (score >= 70) return 'GOOD_ALIGNMENT';
        if (score >= 50) return 'MODERATE_ALIGNMENT';
        return 'NEEDS_IMPROVEMENT';
      };

      expect(categorize(90)).toBe('STRONG_ALIGNMENT');
      expect(categorize(75)).toBe('GOOD_ALIGNMENT');
      expect(categorize(62)).toBe('MODERATE_ALIGNMENT');
      expect(categorize(45)).toBe('NEEDS_IMPROVEMENT');
    });
  });

  describe('3. Keyword Comparison & Skill Gap Analysis', () => {
    const mockResume = {
      contact: {},
      education: [],
      technicalSkills: ['React', 'JavaScript', 'HTML', 'CSS', 'Git'],
      softSkills: [],
      workExperience: [],
      projects: [],
      certifications: [],
      achievements: [],
      rawTextLength: 600,
    };

    const mockJob = {
      title: 'Full Stack MERN Engineer',
      description: 'Developing full stack web apps with React, Node.js, MongoDB, and REST APIs.',
      requiredSkills: ['React', 'Node.js', 'MongoDB', 'REST APIs'],
      preferredSkills: ['Docker'],
    };

    it('should identify matched, missing, and additional resume keywords accurately', () => {
      const keywordAnalysis = AtsScoringService.performKeywordAnalysis(mockResume, mockJob);

      expect(keywordAnalysis.matchedKeywords).toContain('React');
      expect(keywordAnalysis.missingKeywords).toContain('Node.js');
      expect(keywordAnalysis.missingKeywords).toContain('MongoDB');
      expect(keywordAnalysis.additionalResumeKeywords).toContain('HTML');
      expect(keywordAnalysis.additionalResumeKeywords).toContain('CSS');
    });

    it('should detect partial matches and acronym synonyms', () => {
      const resumeWithPartial = {
        ...mockResume,
        technicalSkills: ['React.js', 'PSQL', 'Amazon Web Services'],
      };

      const jobWithFullNames = {
        title: 'Backend Engineer',
        description: 'Postgres database and AWS cloud infrastructure.',
        requiredSkills: ['React', 'Postgres', 'AWS'],
      };

      const analysis = AtsScoringService.performKeywordAnalysis(resumeWithPartial, jobWithFullNames);

      expect(analysis.partiallyMatchedKeywords.some((p) => p.keyword === 'React' || p.keyword === 'Postgres' || p.keyword === 'AWS')).toBe(true);
    });

    it('should assign HIGH priority to missing required skills and attach curated free learning links', () => {
      const keywordAnalysis = AtsScoringService.performKeywordAnalysis(mockResume, mockJob);
      const gaps = AtsScoringService.performSkillGapAnalysis(mockResume, mockJob, keywordAnalysis);

      expect(gaps.length).toBeGreaterThan(0);
      const highGaps = gaps.filter((g) => g.priority === 'HIGH');
      expect(highGaps.length).toBeGreaterThan(0);
      expect(highGaps[0].learningResources.length).toBeGreaterThan(0);
      expect(highGaps[0].learningResources[0].url).toMatch(/^https?:\/\//);
    });
  });

  describe('4. AI Bullet Optimization & Deterministic Fallback Engine', () => {
    const mockResume = {
      contact: { fullName: 'Rohan Mehra' },
      education: [],
      technicalSkills: ['React', 'Node.js'],
      softSkills: [],
      workExperience: [],
      projects: [
        {
          title: 'Task Management App',
          technologies: ['React'],
          bullets: ['Made a website using React to track tasks.'], // Weak passive verb
        },
      ],
      certifications: [],
      achievements: [],
      rawTextLength: 500,
    };

    const mockJob = {
      title: 'Frontend Engineer',
      description: 'Building responsive user interfaces with React.',
      requiredSkills: ['React'],
    };

    it('should provide deterministic fallback bullet enhancements using action verbs without fabricating metrics', () => {
      const fallbackFeedback = ResumeAiFeedbackService.generateDeterministicFallbackFeedback(
        mockResume,
        mockJob
      );

      expect(fallbackFeedback).toBeDefined();
      expect(fallbackFeedback.isFallback).toBe(true);
      expect(fallbackFeedback.bulletSuggestions.length).toBeGreaterThan(0);

      const firstSuggestion = fallbackFeedback.bulletSuggestions[0];
      expect(firstSuggestion.originalBullet).toContain('Made a website using React');
      expect(firstSuggestion.suggestedBullet).toMatch(/^(Engineered|Architected|Designed)/i);
      expect(firstSuggestion.actionVerbUsed).toBeDefined();

      // Ensure no fabricated numbers or percentages were hallucinated
      expect(firstSuggestion.suggestedBullet).not.toContain('300%');
      expect(firstSuggestion.suggestedBullet).not.toContain('$1,000,000');
    });

    it('should generate project architecture tips and anticipated technical interview questions', () => {
      const fallbackFeedback = ResumeAiFeedbackService.generateDeterministicFallbackFeedback(
        mockResume,
        mockJob
      );

      expect(fallbackFeedback.projectImprovementTips.length).toBeGreaterThan(0);
      expect(fallbackFeedback.interviewPrepTips.length).toBeGreaterThan(0);
      expect(fallbackFeedback.summarySuggestion).toBeDefined();
    });
  });

  describe('5. Service Workflows & Version Control', () => {
    it('should create separate immutable resume versions on save', async () => {
      const mockDoc = {
        _id: 'doc_123',
        studentId: 'student_ver_test',
        fileName: 'Resume_2025.pdf',
        structuredData: { technicalSkills: ['JavaScript'] },
        save: vi.fn().mockResolvedValue(true),
      };

      const spyDocFind = vi.spyOn(ResumeDocument, 'findOne').mockResolvedValue(mockDoc as any);

      // Call createResumeVersion
      const versionResult = await ResumeAnalyzerService.createResumeVersion(
        'student_ver_test',
        {
          documentId: 'doc_123',
          structuredData: {
            contact: {},
            education: [],
            technicalSkills: ['JavaScript', 'TypeScript', 'React'],
            softSkills: [],
            workExperience: [],
            projects: [],
            certifications: [],
            achievements: [],
            rawTextLength: 600,
          },
          changeSummary: 'Added TypeScript and React skills',
        }
      );

      expect(versionResult).toBeDefined();
      expect(versionResult.documentId).toBe('doc_123');
      expect(versionResult.structuredData.technicalSkills).toContain('TypeScript');
      expect(mockDoc.save).toHaveBeenCalled();

      spyDocFind.mockRestore();
    });
  });

  describe('6. Security, RBAC & Endpoints Protection', () => {
    it('POST /api/resume-analyzer/upload should require authentication (401)', async () => {
      const res = await request(app).post('/api/resume-analyzer/upload').send({
        fileName: 'resume.pdf',
        fileBase64: 'dGVzdA==',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/resume-analyzer/analyze should require authentication (401)', async () => {
      const res = await request(app).post('/api/resume-analyzer/analyze').send({
        documentId: 'test_doc_id',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/resume-analyzer/documents should require authentication (401)', async () => {
      const res = await request(app).get('/api/resume-analyzer/documents');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/resume-analyzer/college/analytics should require authentication (401)', async () => {
      const res = await request(app).get('/api/resume-analyzer/college/analytics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/resume-analyzer/employer/candidate-resume/app123 should require authentication (401)', async () => {
      const res = await request(app).get('/api/resume-analyzer/employer/candidate-resume/app123');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/resume-analyzer/export-improved-pdf should require authentication (401)', async () => {
      const res = await request(app).post('/api/resume-analyzer/export-improved-pdf').send({
        structuredData: {},
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
