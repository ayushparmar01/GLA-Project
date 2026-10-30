import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { LearningHubDashboard } from '../components/learning/LearningHubDashboard';
import { ResourceLibraryView } from '../components/learning/ResourceLibraryView';
import { ResourceDetailModal } from '../components/learning/ResourceDetailModal';
import { LearningPathsView } from '../components/learning/LearningPathsView';
import { LearningPathDetailView } from '../components/learning/LearningPathDetailView';
import { SkillGapLearningView } from '../components/learning/SkillGapLearningView';
import { PersonalLibraryBookmarksView } from '../components/learning/PersonalLibraryBookmarksView';
import { LearningQuizModal } from '../components/learning/LearningQuizModal';
import { AdminLearningManagementCard } from '../components/learning/AdminLearningManagementCard';
import { CollegeLearningOverviewCard } from '../components/learning/CollegeLearningOverviewCard';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    fetchLearningHubDashboardApi: vi.fn(),
    fetchLearningResourcesApi: vi.fn(),
    fetchLearningResourceDetailApi: vi.fn(),
    toggleResourceBookmarkApi: vi.fn(),
    fetchResourceBookmarksApi: vi.fn(),
    reportLearningResourceApi: vi.fn(),
    fetchLearningPathsApi: vi.fn(),
    fetchLearningPathDetailApi: vi.fn(),
    enrollLearningPathApi: vi.fn(),
    updateModuleProgressApi: vi.fn(),
    fetchLearningQuizApi: vi.fn(),
    submitLearningQuizApi: vi.fn(),
    fetchLearningRecommendationsApi: vi.fn(),
    fetchSkillGapLearningMapApi: vi.fn(),
    fetchCollegeLearningAnalyticsApi: vi.fn(),
    fetchAdminLearningReportsApi: vi.fn(),
    resolveAdminLearningReportApi: vi.fn(),
    verifyAdminLearningResourceApi: vi.fn(),
    upsertAdminLearningResourceApi: vi.fn(),
    seedAdminLearningDataApi: vi.fn(),
  };
});

describe('Phase 17 — Advanced Learning & Resource Hub Frontend Test Suite', () => {
  const mockResource = {
    id: 'res-mdn-js',
    title: 'MDN Web Docs: Modern JavaScript Handbook',
    topic: 'Modern JavaScript (ES6+)',
    skill: 'JavaScript',
    skills: ['JavaScript', 'ES6', 'DOM', 'Web APIs'],
    category: 'Web Development',
    tags: ['frontend', 'javascript'],
    resourceType: 'Documentation',
    provider: 'Mozilla Developer Network',
    url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    difficulty: 'BEGINNER' as const,
    description: 'The premier industry documentation covering variables, closures, prototypes, async/await.',
    estimatedDuration: '10 hours',
    durationMinutes: 600,
    language: 'en',
    verificationStatus: 'VERIFIED' as const,
    isPublished: true,
    rating: 4.9,
    reviewCount: 340,
    isBookmarked: false,
    isVerified: true,
    isActive: true,
  };

  const mockDashboardData = {
    stats: {
      enrolledPathsCount: 2,
      completedPathsCount: 1,
      completedResourcesCount: 5,
      inProgressResourcesCount: 1,
      bookmarkedResourcesCount: 4,
      quizzesPassedCount: 3,
      currentStreakDays: 7,
    },
    activeEnrollments: [],
    recentActivities: [],
    continueLearning: [
      {
        learningPathId: 'path-full-stack',
        learningPathTitle: 'Full Stack Web Developer Career Path',
        moduleId: 'mod-fs-2',
        moduleTitle: 'Module 2: Declarative UI with React & Hooks',
        progressPercentage: 50,
        lastAccessedAt: new Date().toISOString(),
      },
    ],
    recommendations: [
      {
        resource: mockResource,
        matchScore: 94,
        pillars: [
          { name: 'Career Goal Match', weight: 30, score: 30, maxScore: 30, explanation: 'Direct role match' },
          { name: 'Skill Gap Addressed', weight: 30, score: 26, maxScore: 30, explanation: 'Bridges JS gap' },
          { name: 'Industry Placement Demand', weight: 20, score: 20, maxScore: 20, explanation: 'High demand' },
          { name: 'Difficulty Suitability', weight: 10, score: 9, maxScore: 10, explanation: 'Paced well' },
          { name: 'Learning Format Efficiency', weight: 10, score: 9, maxScore: 10, explanation: 'Docs format' },
        ],
        whyRecommended: ['Directly matches your target career aspiration in Full Stack.'],
        careerGoalMatch: 'Full Stack Match',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Learning Hub Dashboard', () => {
    it('should render the welcome banner, learning streak, key statistics, and continue learning card', async () => {
      vi.mocked(api.fetchLearningHubDashboardApi).mockResolvedValue({
        success: true,
        data: mockDashboardData as any,
      });

      render(<LearningHubDashboard token="test-token" />);

      // Top banner
      expect(await screen.findByText('Advanced Learning & Resource Hub')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('Days Active')).toBeInTheDocument();

      // Stats cards
      expect(screen.getByText('Enrolled Paths')).toBeInTheDocument();
      expect(screen.getByText('Saved Bookmarks')).toBeInTheDocument();

      // Continue learning section
      expect(screen.getByText('Full Stack Web Developer Career Path')).toBeInTheDocument();
      expect(screen.getByText('Resume Module')).toBeInTheDocument();
    });

    it('should render 5-pillar recommendations and toggle algorithmic rationale breakdown', async () => {
      vi.mocked(api.fetchLearningHubDashboardApi).mockResolvedValue({
        success: true,
        data: mockDashboardData as any,
      });

      render(<LearningHubDashboard token="test-token" />);

      // Match score badge
      expect(await screen.findByText('94% Match')).toBeInTheDocument();

      // Toggle breakdown
      const toggleBtn = screen.getByText(/View Score Rationale/i);
      fireEvent.click(toggleBtn);

      expect(screen.getByText(/5-Pillar Algorithmic Breakdown/i)).toBeInTheDocument();
      expect(screen.getByText('30 / 30 pts')).toBeInTheDocument();
    });
  });

  describe('2. Resource Library View', () => {
    it('should render 10 resource type chips and filter catalog', async () => {
      vi.mocked(api.fetchLearningResourcesApi).mockResolvedValue({
        success: true,
        data: [mockResource],
      });

      render(<ResourceLibraryView token="test-token" />);

      expect(await screen.findByText('Curated Technical Resource Library')).toBeInTheDocument();
      expect(screen.getByText('All Types (10)')).toBeInTheDocument();
      expect(screen.getByText('Video Tutorials')).toBeInTheDocument();
      expect(screen.getByText('Courses')).toBeInTheDocument();
      expect(screen.getByText('Articles')).toBeInTheDocument();

      // Click Video Tutorials chip
      fireEvent.click(screen.getByText('Video Tutorials'));
      await waitFor(() => {
        expect(api.fetchLearningResourcesApi).toHaveBeenCalledWith(
          expect.objectContaining({ resourceType: 'Video Tutorials' }),
          'test-token'
        );
      });
    });

    it('should handle search input dynamically', async () => {
      vi.mocked(api.fetchLearningResourcesApi).mockResolvedValue({
        success: true,
        data: [mockResource],
      });

      render(<ResourceLibraryView token="test-token" />);

      const searchInput = screen.getByPlaceholderText(/Search by skill/i);
      fireEvent.change(searchInput, { target: { value: 'React' } });

      await waitFor(() => {
        expect(api.fetchLearningResourcesApi).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'React' }),
          'test-token'
        );
      });
    });
  });

  describe('3. Resource Detail Modal & Actions', () => {
    it('should render modal, save personal notes, and handle reporting', async () => {
      const onClose = vi.fn();
      vi.mocked(api.toggleResourceBookmarkApi).mockResolvedValue({
        success: true,
        isBookmarked: true,
      });
      vi.mocked(api.reportLearningResourceApi).mockResolvedValue({
        success: true,
        data: { id: 'rep-1', status: 'PENDING' } as any,
      });

      render(
        <ResourceDetailModal
          resource={mockResource}
          token="test-token"
          onClose={onClose}
        />
      );

      expect(screen.getByText(mockResource.title)).toBeInTheDocument();

      // Save a private note
      const noteInput = screen.getByPlaceholderText(/Add key insights/i);
      fireEvent.change(noteInput, { target: { value: 'Crucial prototype chain notes' } });

      const saveBtn = screen.getByText('Save Note');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(api.toggleResourceBookmarkApi).toHaveBeenCalledWith(
          mockResource.id,
          { personalNote: 'Crucial prototype chain notes' },
          'test-token'
        );
      });

      // Trigger report issue
      const reportBtn = screen.getByText('Report issue');
      fireEvent.click(reportBtn);

      const reportDetailInput = screen.getByPlaceholderText(/Please specify why/i);
      fireEvent.change(reportDetailInput, { target: { value: 'Link returns 404' } });

      const submitReportBtn = screen.getByText('Send Report');
      fireEvent.click(submitReportBtn);

      await waitFor(() => {
        expect(api.reportLearningResourceApi).toHaveBeenCalled();
      });
    });
  });

  describe('4. Structured Learning Paths & Module Detail', () => {
    const mockPath = {
      id: 'path-full-stack',
      title: 'Full Stack Web Developer Career Path',
      slug: 'full-stack-web-developer',
      description: 'Master frontend architecture, backend Node.js APIs.',
      careerRole: 'Full Stack Web Developer',
      targetSkills: ['React', 'Node.js', 'SQL'],
      prerequisites: ['Basic coding'],
      difficulty: 'INTERMEDIATE' as const,
      estimatedDuration: '12 weeks',
      estimatedHours: 60,
      moduleCount: 2,
      modules: [
        {
          id: 'mod-1',
          learningPathId: 'path-full-stack',
          sequence: 1,
          title: 'Module 1: ES6 Foundations',
          description: 'Promises, closures and async/await.',
          skillsCovered: ['JavaScript'],
          resourceIds: ['res-mdn-js'],
          practiceActivities: [{ title: 'Build Kanban Board', description: 'DOM drag drop', type: 'PROJECT' as const }],
          isRequired: true,
          estimatedHours: 15,
        },
      ],
      icon: 'Globe',
      color: 'indigo',
      isPublished: true,
      isFeatured: true,
      enrollmentCount: 120,
      completionCount: 30,
    };

    it('should render learning path catalogue and enroll student', async () => {
      vi.mocked(api.fetchLearningPathsApi).mockResolvedValue({
        success: true,
        data: [mockPath],
      });
      vi.mocked(api.enrollLearningPathApi).mockResolvedValue({
        success: true,
        data: { id: 'enr-1', status: 'IN_PROGRESS', progressPercentage: 0 } as any,
      });

      render(<LearningPathsView token="test-token" />);

      expect(await screen.findByText('Full Stack Web Developer Career Path')).toBeInTheDocument();
      const enrollBtn = screen.getByText('Enroll Now');
      fireEvent.click(enrollBtn);

      await waitFor(() => {
        expect(api.enrollLearningPathApi).toHaveBeenCalledWith(mockPath.id, 'test-token');
      });
    });

    it('should render module timeline and mark module completed in detail view', async () => {
      const onBack = vi.fn();
      vi.mocked(api.fetchLearningPathDetailApi).mockResolvedValue({
        success: true,
        data: {
          ...mockPath,
          userEnrollment: { id: 'enr-1', status: 'IN_PROGRESS', progressPercentage: 0 } as any,
        },
      });
      vi.mocked(api.updateModuleProgressApi).mockResolvedValue({
        success: true,
        data: {} as any,
      });

      render(
        <LearningPathDetailView
          pathId={mockPath.id}
          token="test-token"
          onBack={onBack}
        />
      );

      expect(await screen.findByText('Module 1: ES6 Foundations')).toBeInTheDocument();

      const markCompletedBtn = screen.getByText('Mark Completed');
      fireEvent.click(markCompletedBtn);

      await waitFor(() => {
        expect(api.updateModuleProgressApi).toHaveBeenCalledWith(
          mockPath.id,
          'mod-1',
          expect.objectContaining({ status: 'COMPLETED' }),
          'test-token'
        );
      });
    });
  });

  describe('5. Skill Gap to Learning Path Bridge View', () => {
    it('should render skill gap items with recommended paths and curated resources', async () => {
      vi.mocked(api.fetchSkillGapLearningMapApi).mockResolvedValue({
        success: true,
        data: [
          {
            skill: 'Docker',
            gapStatus: 'MISSING',
            source: 'ASSESSMENT',
            recommendedPaths: [
              {
                id: 'path-cloud',
                title: 'Cloud Architect & DevOps Engineer',
                careerRole: 'Cloud Engineer',
                difficulty: 'INTERMEDIATE',
                estimatedDuration: '10 weeks',
              },
            ],
            recommendedResources: [mockResource],
          },
        ],
      });

      render(<SkillGapLearningView token="test-token" />);

      expect(await screen.findByText('Skill Gap to Learning Path Bridge')).toBeInTheDocument();
      expect(screen.getByText('Docker')).toBeInTheDocument();
      expect(screen.getByText('Cloud Architect & DevOps Engineer')).toBeInTheDocument();
    });
  });

  describe('6. Personal Library Bookmarks View', () => {
    it('should render saved bookmarks, edit personal notes, and remove bookmark', async () => {
      const mockBookmark = {
        id: 'bm-101',
        studentId: 'student-1',
        resourceId: mockResource.id,
        resource: mockResource,
        personalNote: 'Important prototype inheritance reference',
        category: 'General',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(api.fetchResourceBookmarksApi).mockResolvedValue({
        success: true,
        data: [mockBookmark],
      });
      vi.mocked(api.toggleResourceBookmarkApi).mockResolvedValue({
        success: true,
        isBookmarked: false,
      });

      render(<PersonalLibraryBookmarksView token="test-token" />);

      expect(await screen.findByText('My Personal Learning Library')).toBeInTheDocument();
      expect(screen.getByText(mockResource.title)).toBeInTheDocument();
      expect(screen.getByText('Important prototype inheritance reference')).toBeInTheDocument();

      // Remove bookmark
      const removeBtn = screen.getByTitle('Remove from saved library');
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(api.toggleResourceBookmarkApi).toHaveBeenCalledWith(mockResource.id, {}, 'test-token');
      });
    });
  });

  describe('7. Knowledge Check Quiz Modal', () => {
    const mockQuiz = {
      id: 'quiz-js-1',
      title: 'JavaScript Essentials Quiz',
      skill: 'JavaScript',
      difficulty: 'BEGINNER' as const,
      passingScore: 70,
      questionCount: 1,
      questions: [
        {
          id: 'q1',
          questionText: 'What is the scope of a let declaration?',
          options: [
            { id: 'opt-a', text: 'Block scope' },
            { id: 'opt-b', text: 'Function scope only' },
          ],
        },
      ],
    };

    it('should render questions without leaking answer keys and evaluate score on server', async () => {
      const onClose = vi.fn();
      vi.mocked(api.fetchLearningQuizApi).mockResolvedValue({
        success: true,
        data: mockQuiz,
      });
      vi.mocked(api.submitLearningQuizApi).mockResolvedValue({
        success: true,
        data: {
          id: 'att-1',
          studentId: 's1',
          quizId: 'quiz-js-1',
          score: 100,
          totalQuestions: 1,
          correctCount: 1,
          passed: true,
          answers: { q1: 'opt-a' },
          evaluations: [
            {
              questionId: 'q1',
              questionText: 'What is the scope of a let declaration?',
              selectedOptionId: 'opt-a',
              correctOptionId: 'opt-a',
              isCorrect: true,
              explanation: 'let is block-scoped in modern JS.',
            },
          ],
          attemptedAt: new Date().toISOString(),
        },
      });

      render(<LearningQuizModal quizId="quiz-js-1" token="test-token" onClose={onClose} />);

      expect(await screen.findByText('JavaScript Essentials Quiz')).toBeInTheDocument();
      expect(screen.getByText('What is the scope of a let declaration?')).toBeInTheDocument();

      // Select option
      const optBtn = screen.getByText('Block scope');
      fireEvent.click(optBtn);

      // Submit
      const submitBtn = screen.getByText('Submit Answers');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.submitLearningQuizApi).toHaveBeenCalledWith(
          'quiz-js-1',
          { q1: 'opt-a' },
          undefined,
          'test-token'
        );
      });

      // Evaluated results
      expect(await screen.findByText('Knowledge Check Passed!')).toBeInTheDocument();
      expect(screen.getByText('let is block-scoped in modern JS.')).toBeInTheDocument();
    });
  });

  describe('8. Admin Learning Management Card', () => {
    it('should render user grievance reports and resolve reports', async () => {
      const mockReport = {
        id: 'rep-1',
        studentId: 'stud-1',
        studentName: 'Rohan Verma',
        resourceId: 'res-mdn-js',
        resourceTitle: 'MDN Web Docs',
        reason: 'BROKEN_LINK' as const,
        details: 'The reference link is returning 404 in certain browsers.',
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
      };

      vi.mocked(api.fetchAdminLearningReportsApi).mockResolvedValue({
        success: true,
        data: [mockReport],
      });
      vi.mocked(api.resolveAdminLearningReportApi).mockResolvedValue({
        success: true,
        data: { ...mockReport, status: 'RESOLVED' },
      });

      render(<AdminLearningManagementCard token="test-admin-token" />);

      expect(await screen.findByText(/Learning Hub Administration & Quality Desk/i)).toBeInTheDocument();
      expect(screen.getByText('BROKEN_LINK')).toBeInTheDocument();

      const resolveBtn = screen.getByText(/Mark Resolved/i);
      fireEvent.click(resolveBtn);

      await waitFor(() => {
        expect(api.resolveAdminLearningReportApi).toHaveBeenCalledWith(
          'rep-1',
          expect.objectContaining({ status: 'RESOLVED' }),
          'test-admin-token'
        );
      });
    });
  });

  describe('9. College Learning Overview Card', () => {
    it('should render aggregated institutional analytics with student privacy safeguards', async () => {
      vi.mocked(api.fetchCollegeLearningAnalyticsApi).mockResolvedValue({
        success: true,
        data: {
          collegeId: 'col-1',
          collegeName: 'Govt Engineering College',
          totalStudentsActive: 48,
          totalEnrollments: 76,
          totalPathCompletions: 24,
          topEnrolledPaths: [
            { pathId: 'p-1', title: 'Full Stack Web Developer Career Path', count: 32 },
          ],
          topLearnedSkills: [{ skill: 'JavaScript', count: 48 }],
          resourceEngagementByType: { Documentation: 90 },
          averageCompletionRate: 32,
          generatedAt: new Date().toISOString(),
        },
      });

      render(<CollegeLearningOverviewCard token="test-college-token" />);

      expect(await screen.findByText('Institutional Learning & Skill Development Analytics')).toBeInTheDocument();
      expect(screen.getByText('48')).toBeInTheDocument();
      expect(screen.getByText('76')).toBeInTheDocument();
      expect(screen.getByText('Full Stack Web Developer Career Path')).toBeInTheDocument();
      expect(screen.getByText('32 students')).toBeInTheDocument();
    });
  });
});
