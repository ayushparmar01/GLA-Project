import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CareerAssistantView } from '../components/student/CareerAssistantView';
import { LearningRoadmapDashboardView } from '../components/student/LearningRoadmapDashboardView';
import { RoadmapDetailsView } from '../components/student/RoadmapDetailsView';
import { LearningResourceExplorerView } from '../components/student/LearningResourceExplorerView';
import { InterviewPreparationView } from '../components/student/InterviewPreparationView';
import { AiResumeFeedbackModal } from '../components/student/AiResumeFeedbackModal';
import * as api from '../services/api';
import {
  AiConversationData,
  LearningRoadmapData,
  LearningResourceData,
  InterviewPracticeQuestion,
  InterviewFeedbackReport,
  ResumeFeedbackReport,
} from '../types';

vi.mock('../services/api');

const mockConversation: AiConversationData = {
  id: 'conv-101',
  studentId: 'stud-1',
  title: 'Full-Stack Campus Drive Strategy',
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: 'How can I prepare for Full-Stack developer campus drives?',
      timestamp: '2026-10-30T10:00:00.000Z',
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: 'To prepare effectively for Tier-2/3 off-campus and pool drives, focus on: 1. Core Data Structures (Arrays, Hash Maps, Trees), 2. Modern Full-Stack stack (React + Node.js + Express + PostgreSQL/MongoDB), 3. At least 2 deployed full-stack web applications with GitHub repositories and live URLs.',
      isFallback: true,
      provider: 'DETERMINISTIC_FALLBACK',
      fallbackReason: 'AI provider credentials not configured or remote API unavailable',
      timestamp: '2026-10-30T10:00:02.000Z',
    },
  ],
  createdAt: '2026-10-30T10:00:00.000Z',
  updatedAt: '2026-10-30T10:00:02.000Z',
};

const mockRoadmap: LearningRoadmapData = {
  id: 'road-201',
  studentId: 'stud-1',
  targetRole: 'Full-Stack Software Engineer',
  currentSkillLevel: 'INTERMEDIATE',
  skillGaps: [
    { skill: 'JavaScript', status: 'ASSESSMENT_VERIFIED', importance: 'REQUIRED' },
    { skill: 'React', status: 'SELF_DECLARED', importance: 'REQUIRED' },
    { skill: 'Docker', status: 'MISSING', importance: 'RECOMMENDED' },
  ],
  milestones: [
    {
      id: 'm-1',
      title: 'Advanced JavaScript & Async Systems',
      description: 'Master event loop microtasks, closures, and prototypical inheritance.',
      order: 1,
      estimatedWeeks: 2,
      completed: true,
      completedAt: '2026-10-30T10:00:00.000Z',
      topics: ['Event Loop', 'Promises', 'Closures'],
      projectIdea: 'Build an asynchronous task queue with concurrency control in TypeScript.',
      practiceTasks: ['Implement Promise.all polyfill', 'Debounce and throttle utilities'],
    },
    {
      id: 'm-2',
      title: 'Full-Stack Web APIs & Database Modeling',
      description: 'Architect RESTful services, transactional integrity, and compound indexing.',
      order: 2,
      estimatedWeeks: 3,
      completed: false,
      topics: ['Express.js', 'PostgreSQL / MongoDB', 'JWT Authentication'],
      projectIdea: 'Develop a role-based recruitment and placement portal.',
      practiceTasks: ['Implement compound indexes', 'Handle distributed transaction rollbacks'],
    },
  ],
  recommendedTopics: ['TypeScript', 'Node.js', 'PostgreSQL'],
  resourceReferences: [
    {
      title: 'MDN Web Docs - JavaScript Guide',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      type: 'Documentation',
      provider: 'Mozilla Developer Network',
    },
  ],
  estimatedDuration: '12 Weeks',
  progress: 50,
  status: 'ACTIVE',
  isAiGenerated: true,
  createdAt: '2026-10-30T10:00:00.000Z',
  updatedAt: '2026-10-30T10:00:00.000Z',
};

const mockResources: LearningResourceData[] = [
  {
    id: 'res-1',
    title: 'React Official Documentation',
    topic: 'React',
    skill: 'React',
    resourceType: 'Documentation',
    provider: 'Meta Open Source',
    url: 'https://react.dev',
    difficulty: 'BEGINNER',
    description: 'The official interactive tutorial and reference guide for React.',
    isVerified: true,
    isActive: true,
  },
  {
    id: 'res-2',
    title: 'Node.js Modern Asynchronous Patterns',
    topic: 'Node.js',
    skill: 'Node.js',
    resourceType: 'Documentation',
    provider: 'OpenJS Foundation',
    url: 'https://nodejs.org/docs',
    difficulty: 'INTERMEDIATE',
    description: 'Core runtime architecture, event loop phases, and streaming I/O.',
    isVerified: true,
    isActive: true,
  },
];

const mockInterviewQuestion: InterviewPracticeQuestion = {
  id: 'iq-tech-01',
  role: 'Full-Stack Software Engineer',
  category: 'TECHNICAL',
  questionText: 'Explain the difference between SQL transactions (ACID properties) and eventual consistency in distributed systems.',
  context: 'Assesses transactional guarantees versus distributed availability trade-offs.',
  sampleAnswerGuidelines: [
    'Define ACID properties',
    'Explain Eventual Consistency',
  ],
  difficulty: 'INTERMEDIATE',
};

const mockInterviewFeedback: InterviewFeedbackReport = {
  questionId: 'iq-tech-01',
  questionText: 'Explain the difference between SQL transactions (ACID properties) and eventual consistency in distributed systems.',
  studentAnswer: 'ACID guarantees atomicity, consistency, isolation, and durability for relational stores. Eventual consistency trades immediate consistency for high availability.',
  score: 85,
  strengths: ['Accurate definition of ACID properties', 'Correctly noted the availability trade-off in distributed systems'],
  areasForImprovement: ['Could elaborate on two-phase commit or quorum consensus'],
  modelAnswerSnippet: 'ACID guarantees that transactions either execute entirely or abort without leaving partial state.',
  isFallback: true,
  provider: 'DETERMINISTIC_FALLBACK',
  disclaimer: 'CareerBridge interview feedback is advisory for practice and reflection. It does not evaluate video, facial expressions, or voice pitch.',
  evaluatedAt: '2026-10-30T10:00:00.000Z',
};

const mockResumeFeedback: ResumeFeedbackReport = {
  overallScore: 78,
  summary: 'Solid foundation with strong technical skills. Add measurable outcomes to project descriptions.',
  isFallback: true,
  provider: 'DETERMINISTIC_FALLBACK',
  sections: [
    {
      sectionName: 'Personal & Contact Information',
      score: 10,
      status: 'STRONG',
      strengths: ['Complete direct contact details (email and phone number).'],
      weaknesses: [],
      actionableSuggestions: [],
    },
    {
      sectionName: 'Technical Skills Presentation',
      score: 9,
      status: 'STRONG',
      strengths: ['Identified modern full-stack web technologies.'],
      weaknesses: [],
      actionableSuggestions: ['Categorize skills into Languages, Frameworks, and Tools.'],
    },
  ],
  roleRelevance: {
    targetRole: 'Full-Stack Developer',
    fitScore: 80,
    matchingKeywords: ['JavaScript', 'React', 'Node.js'],
    missingKeywords: ['Docker', 'PostgreSQL'],
  },
  keyImprovements: ['Include quantitative impact metrics in project bullet points.'],
  disclaimer: 'CareerBridge ATS resume diagnostic feedback is advisory. Review and apply suggestions at your own discretion.',
  analyzedAt: '2026-10-30T10:00:00.000Z',
};

describe('Phase 7: AI Career Guide, Roadmaps & Career Assistant (Frontend Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. CareerAssistantView Component', () => {
    it('should render header, deterministic badge, and starter prompts when no active conversation', async () => {
      vi.mocked(api.fetchAiConversationsApi).mockResolvedValue({
        success: true,
        data: [],
      });

      render(<CareerAssistantView token="test-token" />);

      expect(screen.getByText('CareerBridge AI Career Advisor')).toBeDefined();
      expect(screen.getByText('Deterministic Fallback Enabled')).toBeDefined();
      expect(screen.getByText('How can I guide your career today?')).toBeDefined();
      expect(
        screen.getByText('How can I prepare for Full-Stack developer campus drives?')
      ).toBeDefined();
    });

    it('should display messages and deterministic fallback indicator when conversation is loaded', async () => {
      vi.mocked(api.fetchAiConversationsApi).mockResolvedValue({
        success: true,
        data: [mockConversation],
      });
      vi.mocked(api.fetchAiConversationByIdApi).mockResolvedValue({
        success: true,
        data: mockConversation,
      });

      render(<CareerAssistantView token="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Full-Stack Campus Drive Strategy')).toBeDefined();
      });

      expect(
        screen.getByText('How can I prepare for Full-Stack developer campus drives?')
      ).toBeDefined();
      expect(screen.getByText(/To prepare effectively for Tier-2\/3 off-campus/)).toBeDefined();
      expect(
        screen.getByText(/Deterministic Guidance Engine — grounded in Bharat placement syllabus/)
      ).toBeDefined();
    });

    it('should send new message via sendCareerGuidanceApi when user clicks starter prompt', async () => {
      vi.mocked(api.fetchAiConversationsApi).mockResolvedValue({
        success: true,
        data: [],
      });
      vi.mocked(api.sendCareerGuidanceApi).mockResolvedValue({
        success: true,
        data: mockConversation,
      });

      render(<CareerAssistantView token="test-token" />);

      const starterBtn = screen.getByText('How can I prepare for Full-Stack developer campus drives?');
      fireEvent.click(starterBtn);

      await waitFor(() => {
        expect(api.sendCareerGuidanceApi).toHaveBeenCalledWith(
          'How can I prepare for Full-Stack developer campus drives?',
          undefined,
          undefined,
          'test-token'
        );
      });
    });
  });

  describe('2. LearningRoadmapDashboardView & RoadmapDetailsView', () => {
    it('should render roadmaps list with target role, progress bar, and duration', async () => {
      vi.mocked(api.fetchLearningRoadmapsApi).mockResolvedValue({
        success: true,
        data: [mockRoadmap],
      });

      render(<LearningRoadmapDashboardView token="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Full-Stack Software Engineer')).toBeDefined();
      });

      expect(screen.getByText('Personalized Learning Roadmaps')).toBeDefined();
      expect(screen.getByText('50%')).toBeDefined();
      expect(screen.getByText('1 of 2 steps completed')).toBeDefined();
    });

    it('should navigate to RoadmapDetailsView when clicking a roadmap card', async () => {
      vi.mocked(api.fetchLearningRoadmapsApi).mockResolvedValue({
        success: true,
        data: [mockRoadmap],
      });

      render(<LearningRoadmapDashboardView token="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Full-Stack Software Engineer')).toBeDefined();
      });

      fireEvent.click(screen.getByText('Full-Stack Software Engineer'));

      expect(screen.getByText('Full-Stack Software Engineer Roadmap')).toBeDefined();
      expect(screen.getByText('Back to Roadmaps')).toBeDefined();
      expect(screen.getByText('Advanced JavaScript & Async Systems')).toBeDefined();
      expect(screen.getByText('Full-Stack Web APIs & Database Modeling')).toBeDefined();
    });

    it('should toggle milestone completion via updateLearningRoadmapMilestoneApi', async () => {
      const updatedMockRoadmap: LearningRoadmapData = {
        ...mockRoadmap,
        progress: 100,
        status: 'COMPLETED',
        milestones: mockRoadmap.milestones.map((m) => ({ ...m, completed: true })),
      };

      vi.mocked(api.updateLearningRoadmapMilestoneApi).mockResolvedValue({
        success: true,
        data: updatedMockRoadmap,
      });

      const onUpdateMock = vi.fn();
      const onDeleteMock = vi.fn();
      const onBackMock = vi.fn();

      render(
        <RoadmapDetailsView
          roadmap={mockRoadmap}
          token="test-token"
          onBack={onBackMock}
          onUpdate={onUpdateMock}
          onDelete={onDeleteMock}
        />
      );

      // Check second milestone completion button
      const incompleteStep = screen.getByText('Full-Stack Web APIs & Database Modeling');
      expect(incompleteStep).toBeDefined();

      const toggleButtons = screen.getAllByTitle(/Mark/);
      fireEvent.click(toggleButtons[1]); // Toggle the second milestone

      await waitFor(() => {
        expect(api.updateLearningRoadmapMilestoneApi).toHaveBeenCalledWith(
          'road-201',
          'm-2',
          true,
          'test-token'
        );
        expect(onUpdateMock).toHaveBeenCalled();
      });
    });
  });

  describe('3. LearningResourceExplorerView', () => {
    it('should render verified learning resources with external URLs', async () => {
      vi.mocked(api.fetchLearningResourcesApi).mockResolvedValue({
        success: true,
        data: mockResources,
      });

      render(<LearningResourceExplorerView />);

      await waitFor(() => {
        expect(screen.getByText('React Official Documentation')).toBeDefined();
      });

      expect(screen.getByText('Curated Technical Learning Library')).toBeDefined();
      expect(screen.getByText('By Meta Open Source')).toBeDefined();
      expect(screen.getByText('Node.js Modern Asynchronous Patterns')).toBeDefined();

      const externalLinks = screen.getAllByText('Visit Resource');
      expect(externalLinks.length).toBe(2);
      expect(externalLinks[0].closest('a')?.getAttribute('href')).toBe('https://react.dev');
    });
  });

  describe('4. InterviewPreparationView', () => {
    it('should render interview question picker and allow drafting answers', async () => {
      vi.mocked(api.fetchInterviewQuestionsApi).mockResolvedValue({
        success: true,
        data: [mockInterviewQuestion],
      });

      render(<InterviewPreparationView token="test-token" />);

      await waitFor(() => {
        expect(screen.getAllByText(/Explain the difference between SQL transactions/).length).toBeGreaterThanOrEqual(1);
      });

      expect(screen.getByText('Mock Interview Preparation & Evaluation')).toBeDefined();
      expect(screen.getByText(/CareerBridge mock interview evaluations provide objective feedback/)).toBeDefined();

      const textarea = screen.getByPlaceholderText(/Draft your answer here clearly/);
      fireEvent.change(textarea, {
        target: {
          value: 'ACID stands for Atomicity, Consistency, Isolation, and Durability.',
        },
      });

      expect(textarea).toHaveProperty('value', 'ACID stands for Atomicity, Consistency, Isolation, and Durability.');
    });

    it('should evaluate student answer via evaluateInterviewAnswerApi and render feedback scorecard', async () => {
      vi.mocked(api.fetchInterviewQuestionsApi).mockResolvedValue({
        success: true,
        data: [mockInterviewQuestion],
      });
      vi.mocked(api.evaluateInterviewAnswerApi).mockResolvedValue({
        success: true,
        data: mockInterviewFeedback,
      });

      render(<InterviewPreparationView token="test-token" />);

      await waitFor(() => {
        expect(screen.getAllByText(/Explain the difference between SQL transactions/).length).toBeGreaterThanOrEqual(1);
      });

      const textarea = screen.getByPlaceholderText(/Draft your answer here clearly/);
      fireEvent.change(textarea, { target: { value: 'ACID guarantees atomicity and durability.' } });

      const submitBtn = screen.getByText('Submit for Feedback');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.evaluateInterviewAnswerApi).toHaveBeenCalledWith(
          'iq-tech-01',
          'ACID guarantees atomicity and durability.',
          'test-token'
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Evaluation Report')).toBeDefined();
        expect(screen.getByText('85 / 100')).toBeDefined();
        expect(screen.getByText('Accurate definition of ACID properties')).toBeDefined();
      });
    });
  });

  describe('5. AiResumeFeedbackModal', () => {
    it('should render ATS diagnostic score, keyword matches, and advisory disclaimer', async () => {
      vi.mocked(api.getAiResumeFeedbackApi).mockResolvedValue({
        success: true,
        data: mockResumeFeedback,
      });

      const onCloseMock = vi.fn();

      render(
        <AiResumeFeedbackModal
          isOpen={true}
          onClose={onCloseMock}
          token="test-token"
          targetRole="Full-Stack Developer"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('78 / 100')).toBeDefined();
      });

      expect(screen.getByText('ATS Resume Diagnostic & Keyword Analysis')).toBeDefined();
      expect(screen.getByText('Personal & Contact Information')).toBeDefined();
      expect(screen.getByText('Technical Skills Presentation')).toBeDefined();
      expect(screen.getByText(/CareerBridge ATS resume diagnostic feedback is advisory/)).toBeDefined();

      const closeBtn = screen.getByText('Close Diagnostic');
      fireEvent.click(closeBtn);
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
