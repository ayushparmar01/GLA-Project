import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { RecommendedOpportunitiesView } from '../components/student/RecommendedOpportunitiesView';
import { SkillGapView } from '../components/student/SkillGapView';
import { AdminMatchingConfigCard } from '../components/admin/AdminMatchingConfigCard';
import { EmployerCandidateMatchView } from '../components/employer/EmployerCandidateMatchView';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    fetchRecommendedJobsApi: vi.fn(),
    refreshRecommendationsApi: vi.fn(),
    fetchStudentSkillGapsApi: vi.fn(),
    fetchPublicOpportunitiesApi: vi.fn(),
    fetchMatchingConfigApi: vi.fn(),
    updateMatchingConfigApi: vi.fn(),
    fetchMatchingAnalyticsApi: vi.fn(),
    fetchEmployerJobCandidatesApi: vi.fn(),
    fetchEmployerOpportunitiesApi: vi.fn(),
  };
});

describe('Phase 13 — Advanced AI Job Matching & Explainable Recommendation Engine Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Recommended Opportunities View Component', () => {
    const mockRecommendations = [
      {
        jobId: 'job1',
        drive: {
          id: 'job1',
          title: 'Frontend React Engineer',
          organizationName: 'AlphaTech',
          location: 'Bengaluru',
          workMode: 'REMOTE',
          applicationDeadline: '2026-12-31T23:59:59.000Z',
          requiredSkills: ['React', 'TypeScript'],
        },
        matchScore: 88,
        scoreCoverage: 90,
        matchCategory: 'EXCELLENT_MATCH' as const,
        eligibilityStatus: 'ELIGIBLE' as const,
        eligibility: {
          eligible: true,
          status: 'ELIGIBLE' as const,
          reasons: ['Satisfies all requirements'],
          missingRequirements: [],
          checkedAt: new Date().toISOString(),
        },
        readinessScore: 82,
        scoreBreakdown: {
          skillsScore: 32,
          educationScore: 20,
          assessmentScore: 14,
          experienceScore: 8,
          locationScore: 10,
          rolePreferenceScore: 4,
        },
        explanation: {
          matchingSkills: ['React', 'TypeScript'],
          missingSkills: [],
          academicCompatibility: 'Academic profile is fully aligned.',
          assessmentCompatibility: 'High verified readiness score.',
          preferenceCompatibility: 'Opportunity matches your work mode.',
          recommendedActions: ['Apply before the deadline.'],
        },
        recommendedActions: ['Apply before the deadline.'],
        generatedAt: new Date().toISOString(),
      },
      {
        jobId: 'job2',
        drive: {
          id: 'job2',
          title: 'Backend Node.js Developer',
          organizationName: 'BetaCloud',
          location: 'Hyderabad',
          workMode: 'ONSITE',
          applicationDeadline: '2026-11-30T23:59:59.000Z',
          requiredSkills: ['Node.js', 'PostgreSQL', 'Docker'],
        },
        matchScore: 62,
        scoreCoverage: 80,
        matchCategory: 'MODERATE_MATCH' as const,
        eligibilityStatus: 'NOT_ELIGIBLE' as const,
        eligibility: {
          eligible: false,
          status: 'NOT_ELIGIBLE' as const,
          reasons: ['Missing required skills: Docker'],
          missingRequirements: ['Missing Skill: Docker'],
          checkedAt: new Date().toISOString(),
        },
        readinessScore: 70,
        scoreBreakdown: {
          skillsScore: 20,
          educationScore: 18,
          assessmentScore: 10,
          experienceScore: 6,
          locationScore: 4,
          rolePreferenceScore: 4,
        },
        explanation: {
          matchingSkills: ['Node.js'],
          missingSkills: ['Docker'],
          academicCompatibility: 'Academic profile is aligned.',
          assessmentCompatibility: 'Moderate readiness score.',
          preferenceCompatibility: 'Onsite location differs.',
          recommendedActions: ['Upskill in Docker.'],
        },
        recommendedActions: ['Upskill in Docker.'],
        generatedAt: new Date().toISOString(),
      },
    ];

    it('renders recommendations with distinct match scores and eligibility badges', async () => {
      vi.mocked(api.fetchRecommendedJobsApi).mockResolvedValue({
        success: true,
        data: {
          recommendations: mockRecommendations,
          total: 2,
          readinessScore: 82,
          count: 2,
        },
      });

      render(<RecommendedOpportunitiesView token="valid-test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Frontend React Engineer')).toBeInTheDocument();
        expect(screen.getByText('Backend Node.js Developer')).toBeInTheDocument();
      });

      // Distinct Match categories
      expect(screen.getByText(/Excellent Match/i)).toBeInTheDocument();
      expect(screen.getByText(/Moderate Match/i)).toBeInTheDocument();

      // Independent Eligibility badges (separate from match score)
      expect(screen.getByText('Eligible to Apply')).toBeInTheDocument();
      expect(screen.getByText('Not Eligible')).toBeInTheDocument();

      // Independent Readiness score in banner
      expect(screen.getByText('82/100')).toBeInTheDocument();
    });

    it('displays matching and missing skills chips correctly', async () => {
      vi.mocked(api.fetchRecommendedJobsApi).mockResolvedValue({
        success: true,
        data: {
          recommendations: mockRecommendations,
          total: 2,
          readinessScore: 82,
          count: 2,
        },
      });

      render(<RecommendedOpportunitiesView token="valid-test-token" />);

      await waitFor(() => {
        expect(screen.getByText('✓ React')).toBeInTheDocument();
        expect(screen.getByText('✓ TypeScript')).toBeInTheDocument();
        expect(screen.getByText('✗ Docker')).toBeInTheDocument();
      });
    });

    it('expands 6-pillar breakdown drawer on click', async () => {
      vi.mocked(api.fetchRecommendedJobsApi).mockResolvedValue({
        success: true,
        data: {
          recommendations: mockRecommendations,
          total: 2,
          readinessScore: 82,
          count: 2,
        },
      });

      render(<RecommendedOpportunitiesView token="valid-test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Frontend React Engineer')).toBeInTheDocument();
      });

      const expandButtons = screen.getAllByText(/Why Recommended\? View 6-Pillar Breakdown/i);
      fireEvent.click(expandButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/6-Pillar Compatibility Breakdown/i)).toBeInTheDocument();
        expect(screen.getByText('Technical & Required Skills')).toBeInTheDocument();
        expect(screen.getByText('Academic & Branch Fit')).toBeInTheDocument();
        expect(screen.getByText('Verified Assessment Readiness')).toBeInTheDocument();
        expect(screen.getByText('Experience & Project Portfolio')).toBeInTheDocument();
        expect(screen.getByText('32 / 35 pts')).toBeInTheDocument();
      });
    });
  });

  describe('2. Skill Gap Analysis View Component', () => {
    const mockGapReport = {
      studentId: 'stud123',
      overallMatchScoreAverage: 65,
      matchingSkillsCount: 4,
      missingSkillsCount: 2,
      criticalMissingSkills: ['Kubernetes', 'Go'],
      gaps: [
        {
          skill: 'Kubernetes',
          requirementType: 'MANDATORY' as const,
          studentProficiency: 'NONE' as const,
          verified: false,
          gapCategory: 'MISSING_MANDATORY' as const,
          relevanceScore: 90,
          recommendedAction: 'Mandatory across 3 placement drives. Practice pod deployments.',
          recommendedLearningResource: {
            title: 'Kubernetes for Beginners',
            topic: 'Cloud Computing',
            difficulty: 'INTERMEDIATE',
            url: 'https://kubernetes.io/docs',
            source: 'Official Documentation',
          },
        },
        {
          skill: 'TypeScript',
          requirementType: 'MANDATORY' as const,
          studentProficiency: 'BEGINNER' as const,
          verified: false,
          gapCategory: 'NEEDS_IMPROVEMENT' as const,
          relevanceScore: 75,
          recommendedAction: 'Self-declared. Take standardized assessment to verify proficiency.',
          recommendedLearningResource: {
            title: 'TypeScript Deep Dive',
            topic: 'Web Development',
            difficulty: 'INTERMEDIATE',
            url: 'https://www.typescriptlang.org',
            source: 'TypeScript Handbook',
          },
        },
        {
          skill: 'React',
          requirementType: 'MANDATORY' as const,
          studentProficiency: 'ADVANCED' as const,
          verified: true,
          gapCategory: 'MATCHED' as const,
          relevanceScore: 95,
          recommendedAction: 'Verified at 88%. Maintain proficiency.',
        },
      ],
      prioritizedLearningSequence: ['Kubernetes', 'Go', 'TypeScript'],
      analyzedAt: new Date().toISOString(),
    };

    it('renders skill gap analysis metrics and high priority alert banner', async () => {
      vi.mocked(api.fetchPublicOpportunitiesApi).mockResolvedValue({
        success: true,
        data: [],
      });
      vi.mocked(api.fetchStudentSkillGapsApi).mockResolvedValue({
        success: true,
        data: mockGapReport,
      });

      render(<SkillGapView token="valid-test-token" />);

      await waitFor(() => {
        expect(screen.getByText('65%')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('High Priority Skill Gaps Detected')).toBeInTheDocument();
      });

      expect(screen.getByText('Kubernetes')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });

    it('renders recommended learning sequence with step badges', async () => {
      vi.mocked(api.fetchPublicOpportunitiesApi).mockResolvedValue({
        success: true,
        data: [],
      });
      vi.mocked(api.fetchStudentSkillGapsApi).mockResolvedValue({
        success: true,
        data: mockGapReport,
      });

      render(<SkillGapView token="valid-test-token" />);

      await waitFor(() => {
        expect(screen.getByText(/Recommended Step-by-Step Learning Order/i)).toBeInTheDocument();
      });

      expect(screen.getByText('Kubernetes for Beginners')).toBeInTheDocument();
    });
  });

  describe('3. Admin Matching Configuration Card Component', () => {
    it('validates formula weights and prevents saving if sum is not 100%', async () => {
      vi.mocked(api.fetchMatchingConfigApi).mockResolvedValue({
        success: true,
        data: {
          scoringWeights: {
            skills: 35,
            education: 20,
            assessment: 15,
            experience: 10,
            location: 10,
            rolePreference: 10,
          },
          scoringVersion: 'v13.0',
          updatedAt: new Date().toISOString(),
        },
      });
      vi.mocked(api.fetchMatchingAnalyticsApi).mockResolvedValue({
        success: true,
        data: {
          totalRecommendationsGenerated: 140,
          averageMatchScore: 72,
          distribution: {
            excellent: 35,
            strong: 60,
            moderate: 35,
            low: 10,
          },
          calculatedAt: new Date().toISOString(),
        },
      });

      render(<AdminMatchingConfigCard token="admin-test-token" />);

      await waitFor(() => {
        expect(screen.getByText(/Total Formula Weights Sum:/i)).toBeInTheDocument();
      });

      // Default sum is 100% -> Valid badge
      expect(screen.getByText('100% (Valid: 100%)')).toBeInTheDocument();

      // Change skills weight to 50% -> Sum becomes 115%
      const skillsInput = screen.getByLabelText(/Skills Weight/i) || screen.getAllByRole('spinbutton')[0];
      fireEvent.change(skillsInput, { target: { value: '50' } });

      await waitFor(() => {
        expect(screen.getByText(/Must Equal Exactly 100%/i)).toBeInTheDocument();
      });

      // Save button should be disabled when sum !== 100%
      const saveButton = screen.getByText('Save Weights');
      expect(saveButton).toBeDisabled();

      // Reset to defaults
      const defaultsButton = screen.getByText(/Defaults/i);
      fireEvent.click(defaultsButton);

      await waitFor(() => {
        expect(screen.getByText('100% (Valid: 100%)')).toBeInTheDocument();
      });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('4. Employer Candidate Match View Component', () => {
    const mockCandidates = [
      {
        studentId: 'st1',
        fullName: 'Devi Priya',
        course: 'B.Tech IT',
        graduationYear: 2025,
        cgpa: 8.9,
        matchScore: 91,
        matchCategory: 'EXCELLENT_MATCH' as const,
        eligibilityStatus: 'ELIGIBLE' as const,
        matchingSkills: ['Python', 'Django', 'PostgreSQL'],
        missingSkills: [],
        applicationId: 'app1',
        applicationStatus: 'APPLIED' as const,
        readinessScore: 88,
        hasVerifiedAssessments: true,
      },
    ];

    it('renders candidate compatibility rankings and verified test credentials', async () => {
      vi.mocked(api.fetchEmployerOpportunitiesApi).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'drive1',
            title: 'Senior Backend Engineer',
            organizationName: 'Acme Global',
            description: 'Backend role',
            opportunityType: 'JOB',
            workMode: 'REMOTE',
            status: 'PUBLISHED',
            applicationDeadline: '2026-12-31',
            createdBy: 'emp1',
            createdAt: '2026-01-01',
            updatedAt: '2026-01-01',
          },
        ],
      });
      vi.mocked(api.fetchEmployerJobCandidatesApi).mockResolvedValue({
        success: true,
        data: {
          candidates: mockCandidates,
          count: 1,
        },
      });

      render(<EmployerCandidateMatchView token="emp-test-token" initialDriveId="drive1" />);

      await waitFor(() => {
        expect(screen.getByText('Devi Priya')).toBeInTheDocument();
      });

      expect(screen.getByText('91%')).toBeInTheDocument();
      expect(screen.getByText('88/100')).toBeInTheDocument();
      expect(screen.getByText(/Verified Skill Tests/i)).toBeInTheDocument();
      expect(screen.getByText('✓ Python')).toBeInTheDocument();
    });
  });
});
