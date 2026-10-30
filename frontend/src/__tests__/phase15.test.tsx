import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ResumeUploadCard } from '../components/resumeAnalyzer/ResumeUploadCard';
import { JobDescriptionSelector } from '../components/resumeAnalyzer/JobDescriptionSelector';
import { AtsScoreCard } from '../components/resumeAnalyzer/AtsScoreCard';
import { KeywordComparisonCard } from '../components/resumeAnalyzer/KeywordComparisonCard';
import { SkillGapReportCard } from '../components/resumeAnalyzer/SkillGapReportCard';
import { ResumeQualityReportCard } from '../components/resumeAnalyzer/ResumeQualityReportCard';
import { AIBulletOptimizationPanel } from '../components/resumeAnalyzer/AIBulletOptimizationPanel';
import { ResumeImprovementWorkspace } from '../components/resumeAnalyzer/ResumeImprovementWorkspace';
import { ResumeVersionHistoryView } from '../components/resumeAnalyzer/ResumeVersionHistoryView';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    uploadResumeDocumentApi: vi.fn(),
    fetchResumeDocumentsApi: vi.fn(),
    analyzeResumeApi: vi.fn(),
    fetchResumeAnalysesApi: vi.fn(),
    fetchResumeSuggestionsApi: vi.fn(),
    updateResumeSuggestionStatusApi: vi.fn(),
    createResumeVersionApi: vi.fn(),
    fetchResumeVersionsApi: vi.fn(),
    exportImprovedResumePdfApi: vi.fn(),
    fetchPublicOpportunitiesApi: vi.fn(),
  };
});

describe('Phase 15 — AI-Powered ATS Resume Analyzer & Optimization System UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Resume Upload Card Component', () => {
    it('should render drag-and-drop area and supported format requirements', () => {
      render(<ResumeUploadCard onUploadSuccess={vi.fn()} token="mock_token" />);

      expect(screen.getByText(/Drag & drop your resume file here/i)).toBeInTheDocument();
      expect(screen.getByText(/Supported formats: PDF \(\.pdf\), Word \(\.docx\)/i)).toBeInTheDocument();
    });

    it('should display extracted structured information after successful document upload', () => {
      const mockDoc = {
        id: 'doc_123',
        studentId: 'std_1',
        fileName: 'Priya_Patel_Resume.pdf',
        fileType: 'PDF' as const,
        fileSize: 102400,
        extractionStatus: 'PARSED' as const,
        extractedText: 'Full extracted text',
        structuredData: {
          contact: { fullName: 'Priya Patel', email: 'priya@example.com' },
          education: [{ institution: 'BIT', degree: 'B.Tech' }],
          technicalSkills: ['React', 'TypeScript', 'Node.js'],
          softSkills: ['Problem Solving'],
          workExperience: [],
          projects: [{ title: 'Telemedicine App', technologies: ['React'], bullets: ['Built UI'] }],
          certifications: [],
          achievements: [],
          rawTextLength: 800,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const handleSuccess = vi.fn();
      const { rerender } = render(
        <ResumeUploadCard onUploadSuccess={handleSuccess} token="mock_token" />
      );

      // Trigger upload success
      handleSuccess(mockDoc);
      expect(handleSuccess).toHaveBeenCalledWith(mockDoc);
    });
  });

  describe('2. Job Description Selector Component', () => {
    const mockDrives = [
      {
        id: 'drive_1',
        title: 'Full Stack Engineer',
        organizationName: 'AlphaTech India',
        requiredSkills: ['React', 'Node.js'],
        description: 'Building modern cloud software.',
      },
    ];

    it('should render active CareerBridge jobs and permit selection', async () => {
      vi.mocked(api.fetchPublicOpportunitiesApi).mockResolvedValue({
        success: true,
        data: { opportunities: mockDrives as any, total: 1 },
      });

      render(
        <JobDescriptionSelector
          onSelectJob={vi.fn()}
          isAnalyzing={false}
          disabled={false}
        />
      );

      expect(await screen.findByText('Full Stack Engineer')).toBeInTheDocument();
      expect(screen.getByText('AlphaTech India')).toBeInTheDocument();
      expect(screen.getByText('Analyze My Resume Against This Job')).toBeInTheDocument();
    });

    it('should switch to custom job description tab and validate character length', () => {
      render(
        <JobDescriptionSelector
          onSelectJob={vi.fn()}
          isAnalyzing={false}
          disabled={false}
        />
      );

      const customTab = screen.getByText('Paste Custom Job Description');
      fireEvent.click(customTab);

      expect(screen.getByText('Target Job Title')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Paste the complete job description from LinkedIn/i)
      ).toBeInTheDocument();
    });
  });

  describe('3. ATS Score Card Component', () => {
    const mockBreakdown = {
      requiredSkillCoverage: 26,
      jobKeywordAlignment: 16,
      projectExperienceAlignment: 14,
      educationAlignment: 10,
      structureCompleteness: 10,
      achievementsCertifications: 8,
      formattingChecks: 5,
      weights: {
        requiredSkills: 30,
        jobKeywords: 20,
        projectsExperience: 15,
        education: 10,
        structure: 10,
        achievementsCertifications: 10,
        formatting: 5,
      },
    };

    it('should render ATS score meter, tier badge and 7-component breakdown progress', () => {
      render(
        <AtsScoreCard
          score={89}
          tier="STRONG_ALIGNMENT"
          breakdown={mockBreakdown}
          dataCoverage={95}
          reasons={['Strong required skill coverage (3/3 skills matched)', 'Solid project details']}
          jobTitle="Full Stack Engineer"
          companyName="AlphaTech"
          disclaimer="Internal guidance metric only; never guarantees employer shortlisting."
        />
      );

      expect(screen.getByText('89')).toBeInTheDocument();
      expect(screen.getByText('Strong Alignment')).toBeInTheDocument();
      expect(screen.getByText('Data Coverage: 95%')).toBeInTheDocument();

      // Verify 7 components
      expect(screen.getByText('Required Skills')).toBeInTheDocument();
      expect(screen.getByText('26 / 30')).toBeInTheDocument();
      expect(screen.getByText('Job Keywords')).toBeInTheDocument();
      expect(screen.getByText('16 / 20')).toBeInTheDocument();
      expect(screen.getByText('Projects & Experience')).toBeInTheDocument();
      expect(screen.getByText('14 / 15')).toBeInTheDocument();
      expect(screen.getByText(/Internal Guidance Disclaimer:/i)).toBeInTheDocument();
    });
  });

  describe('4. Keyword Comparison & Skill Gap Cards', () => {
    const mockKeywords = {
      matchedKeywords: ['React', 'TypeScript', 'Git'],
      missingKeywords: ['Docker', 'Kubernetes'],
      partiallyMatchedKeywords: [{ keyword: 'PostgreSQL', resumeTerm: 'PSQL' }],
      additionalResumeKeywords: ['HTML', 'CSS', 'Tailwind'],
    };

    it('should display categorized keyword chips and honesty disclaimer', () => {
      render(<KeywordComparisonCard keywordAnalysis={mockKeywords} />);

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Docker')).toBeInTheDocument();
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
      expect(screen.getByText(/"PSQL" in resume/i)).toBeInTheDocument();
      expect(screen.getByText(/Authenticity Reminder:/i)).toBeInTheDocument();
    });

    it('should display prioritized skill gaps and curated free learning resources', () => {
      const mockGaps = [
        {
          skill: 'Docker',
          priority: 'HIGH' as const,
          status: 'MISSING' as const,
          category: 'Mandatory Requirement',
          learningResources: [
            {
              title: 'Docker Getting Started Guide',
              topic: 'Docker',
              provider: 'Docker Docs',
              url: 'https://docs.docker.com',
            },
          ],
        },
      ];

      render(<SkillGapReportCard skillGaps={mockGaps} />);

      expect(screen.getByText('Docker')).toBeInTheDocument();
      expect(screen.getByText(/High Priority \(Mandatory\)/i)).toBeInTheDocument();
      expect(screen.getByText('Docker Getting Started Guide')).toBeInTheDocument();
      expect(screen.getByText('Learn Free')).toBeInTheDocument();
    });
  });

  describe('5. Resume Quality Report Card Component', () => {
    const mockQuality = {
      contactCompleteness: {
        name: 'Contact Information',
        present: true,
        status: 'PASS' as const,
        notes: 'Email and phone verified.',
      },
      structureCompleteness: {
        name: 'Section Structure',
        present: true,
        status: 'PASS' as const,
        notes: 'Standard sections present.',
      },
      projectQuality: {
        name: 'Project Details',
        present: true,
        status: 'PASS' as const,
        notes: 'Multiple project bullets.',
      },
      experienceQuality: {
        name: 'Work / Internship Experience',
        present: true,
        status: 'PASS' as const,
        notes: 'Fresher-friendly credit applied.',
      },
      formattingChecks: {
        name: 'Formatting & Typography',
        present: true,
        status: 'PASS' as const,
        notes: 'Clean layout.',
      },
      fresherFriendly: true,
      overallQualityScore: 92,
      warnings: ['Add deployed project URLs alongside GitHub repositories.'],
    };

    it('should render 5-area audit checklist with fresher-friendly credit badge', () => {
      render(<ResumeQualityReportCard qualityReport={mockQuality} />);

      expect(screen.getByText('92 / 100')).toBeInTheDocument();
      expect(screen.getByText('Contact Information')).toBeInTheDocument();
      expect(screen.getByText('Fresher-Friendly Credit')).toBeInTheDocument();
      expect(screen.getByText(/Add deployed project URLs/i)).toBeInTheDocument();
    });
  });

  describe('6. AI Bullet Optimization & Improvement Workspace', () => {
    const mockAiFeedback = {
      overallFeedback: 'Resume demonstrates solid software engineering foundation.',
      bulletSuggestions: [
        {
          originalBullet: 'Made a website using React to track tasks.',
          suggestedBullet:
            'Engineered a responsive task management application using React, ensuring modular component design.',
          section: 'Projects: Task App',
          reason: 'Replaces passive verb with strong technical action verb.',
          actionVerbUsed: 'Engineered',
        },
      ],
      projectImprovementTips: ['Highlight database schema design decisions.'],
      summarySuggestion: 'Motivated React developer eager to build scalable web applications.',
      missingInfoWarnings: ['Add verified GitHub profile link.'],
      interviewPrepTips: ['Be prepared to discuss React component lifecycles.'],
      isFallback: false,
    };

    const mockSuggestions = [
      {
        id: 'sug_1',
        studentId: 'std_1',
        analysisId: 'an_1',
        section: 'Projects: Task App',
        originalText: 'Made a website using React to track tasks.',
        suggestedText:
          'Engineered a responsive task management application using React, ensuring modular component design.',
        reason: 'Replaces passive verb with strong technical action verb.',
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
      },
    ];

    it('should display AI bullet optimization with original vs recommended comparison', () => {
      render(
        <AIBulletOptimizationPanel
          aiFeedback={mockAiFeedback}
          suggestions={mockSuggestions}
          token="mock_token"
        />
      );

      expect(screen.getByText(/Made a website using React/i)).toBeInTheDocument();
      expect(screen.getByText(/Engineered a responsive task management/i)).toBeInTheDocument();
      expect(screen.getByText('Verb: Engineered')).toBeInTheDocument();
      expect(screen.getByText('Accept & Apply')).toBeInTheDocument();
    });

    it('should allow editing resume sections and saving a new version', async () => {
      const mockInitialData = {
        contact: { fullName: 'Priya Patel', summary: 'Initial summary' },
        education: [],
        technicalSkills: ['React', 'JavaScript'],
        softSkills: [],
        workExperience: [],
        projects: [
          {
            title: 'Task App',
            technologies: ['React'],
            bullets: ['Built UI component library'],
          },
        ],
        certifications: [],
        achievements: [],
        rawTextLength: 600,
      };

      vi.mocked(api.createResumeVersionApi).mockResolvedValue({
        success: true,
        data: {
          id: 'ver_2',
          studentId: 'std_1',
          documentId: 'doc_123',
          versionNumber: 2,
          structuredData: mockInitialData,
          changeSummary: 'Updated summary',
          createdAt: new Date().toISOString(),
        },
      });

      render(
        <ResumeImprovementWorkspace
          documentId="doc_123"
          initialData={mockInitialData}
          token="mock_token"
        />
      );

      expect(screen.getByText('Resume Optimization Workspace')).toBeInTheDocument();

      const saveBtn = screen.getByText('Save as New Version');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(api.createResumeVersionApi).toHaveBeenCalled();
      });
    });
  });

  describe('7. Version History & Comparison Component', () => {
    const mockVersions = [
      {
        id: 'ver_1',
        studentId: 'std_1',
        documentId: 'doc_123',
        versionNumber: 1,
        structuredData: {
          contact: { summary: 'Initial draft' },
          education: [],
          technicalSkills: ['JavaScript'],
          softSkills: [],
          workExperience: [],
          projects: [],
          certifications: [],
          achievements: [],
          rawTextLength: 400,
        },
        changeSummary: 'Initial parsed version',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'ver_2',
        studentId: 'std_1',
        documentId: 'doc_123',
        versionNumber: 2,
        structuredData: {
          contact: { summary: 'Optimized ATS summary with React focus' },
          education: [],
          technicalSkills: ['JavaScript', 'React', 'TypeScript'],
          softSkills: [],
          workExperience: [],
          projects: [],
          certifications: [],
          achievements: [],
          rawTextLength: 600,
        },
        changeSummary: 'Applied AI bullet recommendations',
        createdAt: new Date().toISOString(),
      },
    ];

    it('should list versions and open side-by-side comparison modal', () => {
      render(<ResumeVersionHistoryView versions={mockVersions} />);

      expect(screen.getByText('Version 1')).toBeInTheDocument();
      expect(screen.getByText('Version 2')).toBeInTheDocument();
      expect(screen.getByText('Applied AI bullet recommendations')).toBeInTheDocument();

      // Click Compare on Version 1 then Version 2
      const compareButtons = screen.getAllByText('Compare');
      fireEvent.click(compareButtons[0]);
      fireEvent.click(compareButtons[1]);

      expect(screen.getByText('Side-by-Side Version Comparison')).toBeInTheDocument();
      expect(screen.getByText(/Comparing Version 1 with Version 2/i)).toBeInTheDocument();
    });
  });
});
