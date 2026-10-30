import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { InterviewPreparationDashboard } from '../components/interview/InterviewPreparationDashboard';
import { InterviewConfigModal } from '../components/interview/InterviewConfigModal';
import { MockInterviewSessionView } from '../components/interview/MockInterviewSessionView';
import { InterviewFeedbackReportView } from '../components/interview/InterviewFeedbackReportView';
import { InterviewAnalyticsView } from '../components/interview/InterviewAnalyticsView';
import { AdminInterviewQuestionManagementCard } from '../components/admin/AdminInterviewQuestionManagementCard';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    createMockInterviewSessionApi: vi.fn(),
    startMockInterviewSessionApi: vi.fn(),
    saveMockInterviewAnswerApi: vi.fn(),
    submitMockInterviewSessionApi: vi.fn(),
    getMockInterviewSessionApi: vi.fn(),
    listMyMockInterviewSessionsApi: vi.fn(),
    queryInterviewCoachApi: vi.fn(),
    fetchStudentInterviewAnalyticsApi: vi.fn(),
    fetchStudentInterviewRoadmapApi: vi.fn(),
    fetchQuestionBankApi: vi.fn(),
    createAdminQuestionApi: vi.fn(),
    deleteAdminQuestionApi: vi.fn(),
    fetchAdminInterviewAnalyticsApi: vi.fn(),
    fetchPublicOpportunitiesApi: vi.fn(),
  };
});

describe('Phase 14 — AI-Powered Mock Interview Platform UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Interview Preparation Dashboard Component', () => {
    const mockAnalytics = {
      studentId: 'std_test_1',
      totalSessionsInitiated: 5,
      totalSessionsCompleted: 4,
      averageOverallScore: 78,
      categoryPerformance: {
        TECHNICAL_DSA: { sessionsCount: 2, averageScore: 82 },
        HR_BEHAVIORAL: { sessionsCount: 2, averageScore: 74 },
      },
      difficultyPerformance: {
        EASY: { sessionsCount: 1, averageScore: 88 },
        INTERMEDIATE: { sessionsCount: 3, averageScore: 75 },
      },
      topicMastery: {
        'Hash Maps': 85,
        'STAR Method': 80,
      },
      commonStrengths: ['Clean code structure', 'Effective STAR methodology framing'],
      recommendedFocusAreas: ['Time complexity optimization', 'Edge case validation'],
      historyTimeline: [],
    };

    it('should render the interview dashboard with KPIs and interview category tracks', async () => {
      vi.mocked(api.fetchStudentInterviewAnalyticsApi).mockResolvedValue({
        success: true,
        data: mockAnalytics,
      });
      vi.mocked(api.listMyMockInterviewSessionsApi).mockResolvedValue({
        success: true,
        data: [],
      });
      vi.mocked(api.fetchPublicOpportunitiesApi).mockResolvedValue({
        success: true,
        data: { opportunities: [], total: 0 },
      });

      render(<InterviewPreparationDashboard token="mock_token" />);

      // Dashboard Header
      expect(await screen.findByText('AI Interview Preparation & Mock Arena')).toBeInTheDocument();
      expect(screen.getByText('DSA & Algorithms')).toBeInTheDocument();
      expect(screen.getByText('HR & Behavioral')).toBeInTheDocument();
      expect(screen.getByText('Job Description Based')).toBeInTheDocument();
      expect(screen.getByText('Resume Based')).toBeInTheDocument();
    });

    it('should open configuration modal when clicking on an interview category practice card', async () => {
      vi.mocked(api.fetchStudentInterviewAnalyticsApi).mockResolvedValue({
        success: true,
        data: mockAnalytics,
      });
      vi.mocked(api.listMyMockInterviewSessionsApi).mockResolvedValue({
        success: true,
        data: [],
      });
      vi.mocked(api.fetchPublicOpportunitiesApi).mockResolvedValue({
        success: true,
        data: { opportunities: [], total: 0 },
      });

      render(<InterviewPreparationDashboard token="mock_token" />);

      await screen.findByText('AI Interview Preparation & Mock Arena');

      // Click "Start Custom Session" or category card
      const startButton = screen.getByText('Start Custom Session');
      fireEvent.click(startButton);

      // Modal should appear
      expect(screen.getByText('Configure Mock Interview Session')).toBeInTheDocument();
      expect(screen.getByText('Interview Track')).toBeInTheDocument();
    });
  });

  describe('2. Interview Configuration Modal Component', () => {
    it('should configure session duration, question count and trigger session creation', async () => {
      const handleStart = vi.fn();
      const handleClose = vi.fn();

      render(
        <InterviewConfigModal
          isOpen={true}
          onClose={handleClose}
          onStartSession={handleStart}
          token="mock_token"
        />
      );

      expect(screen.getByText('Configure Mock Interview Session')).toBeInTheDocument();
      expect(screen.getByText('Technical: DSA & Coding')).toBeInTheDocument();

      // Submit form
      const launchButton = screen.getByText('Launch Interview Session');
      fireEvent.click(launchButton);

      expect(handleStart).toHaveBeenCalled();
      const configArg = handleStart.mock.calls[0][0];
      expect(configArg.type).toBe('TECHNICAL_DSA');
      expect(configArg.durationMinutes).toBeGreaterThanOrEqual(5);
      expect(configArg.questionCount).toBeGreaterThanOrEqual(1);
    });

    it('should switch mode between Practice and Mock simulation', () => {
      const handleStart = vi.fn();
      const handleClose = vi.fn();

      render(
        <InterviewConfigModal
          isOpen={true}
          onClose={handleClose}
          onStartSession={handleStart}
          token="mock_token"
        />
      );

      const mockModeRadio = screen.getByLabelText(/Mock Mode \(Strict Exam Condition\)/i);
      fireEvent.click(mockModeRadio);

      const launchButton = screen.getByText('Launch Interview Session');
      fireEvent.click(launchButton);

      const configArg = handleStart.mock.calls[0][0];
      expect(configArg.mode).toBe('MOCK');
    });
  });

  describe('3. Mock Interview Session View Component', () => {
    const mockSession = {
      id: 'session_active_1',
      studentId: 'std_test_1',
      type: 'TECHNICAL_DSA' as const,
      mode: 'PRACTICE' as const,
      status: 'IN_PROGRESS' as const,
      durationMinutes: 30,
      questionCount: 2,
      targetRole: 'Full Stack Engineer',
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1800000).toISOString(),
      questions: [
        {
          questionId: 'q1',
          title: 'Two Sum Problem',
          category: 'DSA' as const,
          type: 'TECHNICAL_DSA' as const,
          difficulty: 'EASY' as const,
          questionText: 'Given an array of integers and a target, return indices of two numbers that add up to target.',
          starterCodeSnippet: 'function twoSum(nums, target) {\n  // Code here\n}',
          codingLanguage: 'javascript',
          evaluationCriteria: ['Time complexity O(N)', 'Space complexity O(N)'],
          expectedKeyPoints: ['Hash map complement'],
          hints: ['Use an object or Map to store seen elements'],
          sampleAnswerApproach: 'Single pass hash table.',
        },
        {
          questionId: 'q2',
          title: 'Valid Palindrome',
          category: 'DSA' as const,
          type: 'TECHNICAL_DSA' as const,
          difficulty: 'EASY' as const,
          questionText: 'Check if a string is a palindrome ignoring non-alphanumeric characters.',
          codingLanguage: 'javascript',
          evaluationCriteria: ['Two pointers', 'In-place check'],
          expectedKeyPoints: ['Two pointers from head and tail'],
          hints: ['Use two pointers moving inward'],
          sampleAnswerApproach: 'Left and right pointers.',
        },
      ],
      answers: [],
      createdAt: new Date().toISOString(),
    };

    it('should render question navigation, question text and code editor', () => {
      render(
        <MockInterviewSessionView
          session={mockSession}
          token="mock_token"
          onSubmitSession={vi.fn()}
          onExit={vi.fn()}
        />
      );

      expect(screen.getByText('Two Sum Problem')).toBeInTheDocument();
      expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
      expect(screen.getByText('AI Coach Assistant')).toBeInTheDocument();
      expect(screen.getByText('Finish & Submit')).toBeInTheDocument();
    });

    it('should navigate between questions and allow typing answers', () => {
      render(
        <MockInterviewSessionView
          session={mockSession}
          token="mock_token"
          onSubmitSession={vi.fn()}
          onExit={vi.fn()}
        />
      );

      // Type answer
      const answerArea = screen.getByPlaceholderText(/Explain your algorithmic approach/i);
      fireEvent.change(answerArea, {
        target: { value: 'We will iterate through nums and store complement in a hash map.' },
      });
      expect(answerArea).toHaveValue('We will iterate through nums and store complement in a hash map.');

      // Click Next question
      const nextButton = screen.getByText('Next Question');
      fireEvent.click(nextButton);

      expect(screen.getByText('Valid Palindrome')).toBeInTheDocument();
      expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();
    });

    it('should open AI Coach drawer and query hints in practice mode', async () => {
      vi.mocked(api.queryInterviewCoachApi).mockResolvedValue({
        success: true,
        data: {
          reply: 'Consider using a Hash Map to achieve O(N) linear time lookup.',
          isAllowed: true,
          mode: 'PRACTICE',
          queryType: 'HINT',
          suggestedChecklist: ['Track indices', 'Handle edge cases'],
        },
      });

      render(
        <MockInterviewSessionView
          session={mockSession}
          token="mock_token"
          onSubmitSession={vi.fn()}
          onExit={vi.fn()}
        />
      );

      // Open AI Coach Drawer
      const coachButton = screen.getByText('AI Coach Assistant');
      fireEvent.click(coachButton);

      // Coach panel should be visible
      expect(screen.getByText('Interactive AI Interview Coach')).toBeInTheDocument();

      // Click "Get Hint"
      const hintButton = screen.getByText('Get Progressive Hint');
      fireEvent.click(hintButton);

      await waitFor(() => {
        expect(api.queryInterviewCoachApi).toHaveBeenCalled();
        expect(screen.getByText(/Consider using a Hash Map/i)).toBeInTheDocument();
      });
    });
  });

  describe('4. Interview Feedback Report View Component', () => {
    const mockCompletedSession = {
      id: 'session_completed_1',
      studentId: 'std_test_1',
      type: 'TECHNICAL_DSA' as const,
      mode: 'PRACTICE' as const,
      status: 'COMPLETED' as const,
      durationMinutes: 30,
      questionCount: 1,
      targetRole: 'Full Stack Engineer',
      startedAt: new Date(Date.now() - 1500000).toISOString(),
      expiresAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      questions: [
        {
          questionId: 'q1',
          title: 'Two Sum Problem',
          category: 'DSA' as const,
          type: 'TECHNICAL_DSA' as const,
          difficulty: 'EASY' as const,
          questionText: 'Find indices summing to target.',
          evaluationCriteria: ['Time complexity O(N)'],
          expectedKeyPoints: ['Hash map'],
          hints: ['Use map'],
          sampleAnswerApproach: 'Hash map.',
        },
      ],
      answers: [
        {
          questionId: 'q1',
          answerText: 'Used a hash map to check complement.',
          codeSnippet: 'function twoSum(nums, target) { const map = {}; }',
          timeSpentSeconds: 300,
          isAnswered: true,
        },
      ],
      evaluation: {
        overallScore: 86,
        technicalCorrectnessScore: 90,
        codeQualityScore: 85,
        communicationScore: 82,
        starStructureScore: 80,
        rubricBreakdown: {
          algorithmicEfficiency: 90,
          syntaxAndCorrectness: 85,
        },
        strengths: ['Optimal O(N) lookup approach', 'Clean variable naming and comments'],
        improvementAreas: ['Explain space complexity trade-offs explicitly'],
        questionFeedback: [
          {
            questionId: 'q1',
            score: 86,
            technicalAccuracy: 'Accurate and optimal algorithm',
            strengths: ['Identified hash map lookup'],
            improvementAreas: ['State edge cases like empty array'],
            missingConcepts: ['Handling duplicate entries'],
            codeQualityScore: 85,
            syntaxValid: true,
            estimatedTimeComplexity: 'O(N)',
            estimatedSpaceComplexity: 'O(N)',
            modelAnswerApproach: 'Create a hash map mapping value to index, iterate once.',
            nextImprovementSteps: ['Practice 3-Sum variation next.'],
          },
        ],
        summary: 'Excellent performance! You demonstrated solid algorithmic grasp.',
        nextSteps: ['Move to Medium difficulty questions.'],
        evaluatedAt: new Date().toISOString(),
        rubricVersion: 'v14.0',
      },
      createdAt: new Date().toISOString(),
    };

    it('should render comprehensive evaluation report with score meters, strengths and code analysis', () => {
      render(
        <InterviewFeedbackReportView
          session={mockCompletedSession}
          onBackToList={vi.fn()}
          onPracticeAgain={vi.fn()}
        />
      );

      // Score header
      expect(screen.getByText('86')).toBeInTheDocument();
      expect(screen.getByText('Excellent Readiness')).toBeInTheDocument();

      // Strengths & Improvements
      expect(screen.getByText('Optimal O(N) lookup approach')).toBeInTheDocument();
      expect(screen.getByText('Explain space complexity trade-offs explicitly')).toBeInTheDocument();

      // Static code analysis & Big-O
      expect(screen.getByText('O(N)')).toBeInTheDocument();
      expect(screen.getByText('Create a hash map mapping value to index, iterate once.')).toBeInTheDocument();
    });
  });

  describe('5. Admin Interview Question Management Component', () => {
    const mockQuestions = [
      {
        id: 'q_admin_1',
        title: 'Binary Search Implementation',
        category: 'DSA' as const,
        type: 'TECHNICAL_DSA' as const,
        difficulty: 'EASY' as const,
        questionText: 'Implement binary search on a sorted array.',
        codingLanguage: 'javascript',
        evaluationCriteria: ['Time complexity O(log N)'],
        expectedKeyPoints: ['Middle index calculation', 'Pointers shift'],
        hints: ['Keep track of low and high pointers.'],
        sampleAnswerApproach: 'Iterate while low <= high.',
        isActive: true,
        usageCount: 15,
        createdAt: new Date().toISOString(),
      },
    ];

    const mockAdminAnalytics = {
      totalSessionsInitiated: 24,
      totalSessionsCompleted: 20,
      activeQuestionsInBank: 18,
      averageEvaluationScore: 76,
    };

    it('should list questions and display platform-wide interview metrics', async () => {
      vi.mocked(api.fetchQuestionBankApi).mockResolvedValue({
        success: true,
        data: mockQuestions,
      });
      vi.mocked(api.fetchAdminInterviewAnalyticsApi).mockResolvedValue({
        success: true,
        data: mockAdminAnalytics,
      });

      render(<AdminInterviewQuestionManagementCard token="admin_token" />);

      expect(await screen.findByText('Binary Search Implementation')).toBeInTheDocument();
      expect(screen.getByText('Active Questions in Bank')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('76 / 100')).toBeInTheDocument();
    });

    it('should open new question modal and allow adding questions', async () => {
      vi.mocked(api.fetchQuestionBankApi).mockResolvedValue({
        success: true,
        data: mockQuestions,
      });
      vi.mocked(api.fetchAdminInterviewAnalyticsApi).mockResolvedValue({
        success: true,
        data: mockAdminAnalytics,
      });
      vi.mocked(api.createAdminQuestionApi).mockResolvedValue({
        success: true,
        data: { ...mockQuestions[0], id: 'q_admin_2', title: 'Merge Sort' },
      });

      render(<AdminInterviewQuestionManagementCard token="admin_token" />);

      await screen.findByText('Binary Search Implementation');

      // Click "Add Question"
      const addBtn = screen.getByText('Add Question');
      fireEvent.click(addBtn);

      expect(screen.getByText('Add Question to Bank')).toBeInTheDocument();

      // Fill in title
      const titleInput = screen.getByPlaceholderText(/e\.g\. Two Sum or Describe a Challenging Situation/i);
      fireEvent.change(titleInput, { target: { value: 'Merge Sort' } });

      const questionTextInput = screen.getByPlaceholderText(/Full interview question text/i);
      fireEvent.change(questionTextInput, { target: { value: 'Implement divide-and-conquer merge sort.' } });

      // Submit
      const submitBtn = screen.getByText('Save to Question Bank');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.createAdminQuestionApi).toHaveBeenCalled();
      });
    });
  });
});
