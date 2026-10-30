import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillsExplorerView } from '../components/student/SkillsExplorerView';
import { AssessmentCatalogueView } from '../components/student/AssessmentCatalogueView';
import { AssessmentAttemptView } from '../components/student/AssessmentAttemptView';
import { AssessmentResultView } from '../components/student/AssessmentResultView';
import { CareerReadinessView } from '../components/student/CareerReadinessView';
import { SkillGapView } from '../components/student/SkillGapView';
import { RecommendedOpportunitiesView } from '../components/student/RecommendedOpportunitiesView';
import {
  SkillData,
  AssessmentData,
  AssessmentAttemptData,
  CareerReadinessReport,
  SkillGapReport,
  SmartMatchingReport,
} from '../types';

const mockSkills: SkillData[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'Programming Languages',
    description: 'Core JavaScript language fundamentals, closures, asynchronous event loop.',
    relatedSkills: ['TypeScript', 'Node.js', 'React'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
  {
    id: 'react',
    name: 'React',
    category: 'Web Development',
    description: 'Declarative component architecture, hooks lifecycle, virtual DOM.',
    relatedSkills: ['JavaScript', 'TypeScript'],
    difficultyLevel: 'INTERMEDIATE',
    isActive: true,
  },
];

const mockAssessment: AssessmentData = {
  id: 'asm-js-web-dev',
  title: 'Full-Stack JavaScript & Web Development Assessment',
  description: 'Evaluate core JavaScript mechanics, asynchronous promise lifecycles, and React.',
  category: 'Web Development',
  skillsTested: ['JavaScript', 'React', 'Node.js'],
  difficulty: 'INTERMEDIATE',
  durationMinutes: 25,
  totalMarks: 20,
  passingPercentage: 65,
  questionCount: 2,
  questions: [
    {
      id: 'q1-js-eventloop',
      questionText: 'What is the exact execution order of the console.log statements?',
      questionType: 'OUTPUT_PREDICTION',
      codeSnippet: `console.log('1'); setTimeout(() => console.log('2'), 0);`,
      options: [
        { id: 'opt-a', text: '1, 2' },
        { id: 'opt-b', text: '2, 1' },
      ],
      marks: 4,
      negativeMarks: 1,
      skill: 'JavaScript',
    },
    {
      id: 'q2-react-hooks',
      questionText: 'Which statements regarding React hooks rules are correct?',
      questionType: 'MULTIPLE_SELECT',
      options: [
        { id: 'opt-a', text: 'Hooks must only be called at the top level' },
        { id: 'opt-b', text: 'Hooks can be safely invoked inside loops' },
      ],
      marks: 5,
      skill: 'React',
    },
  ],
  isActive: true,
  createdAt: '2026-10-29T18:00:00.000Z',
  updatedAt: '2026-10-29T18:00:00.000Z',
};

const mockAttempt: AssessmentAttemptData = {
  id: 'att-12345',
  studentId: 'usr-student-01',
  assessmentId: 'asm-js-web-dev',
  assessmentTitle: 'Full-Stack JavaScript & Web Development Assessment',
  category: 'Web Development',
  difficulty: 'INTERMEDIATE',
  status: 'IN_PROGRESS',
  answers: {},
  score: 0,
  totalMarks: 20,
  percentage: 0,
  passed: false,
  startedAt: new Date().toISOString(),
  durationMinutes: 25,
  sanitizedQuestions: mockAssessment.questions,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCompletedAttempt: AssessmentAttemptData = {
  ...mockAttempt,
  status: 'SUBMITTED',
  score: 20,
  percentage: 100,
  passed: true,
  timeTakenSeconds: 340,
  submittedAt: new Date().toISOString(),
  skillWiseResults: [
    {
      skill: 'JavaScript',
      totalQuestions: 1,
      correctQuestions: 1,
      score: 4,
      maxScore: 4,
      percentage: 100,
    },
    {
      skill: 'React',
      totalQuestions: 1,
      correctQuestions: 1,
      score: 5,
      maxScore: 5,
      percentage: 100,
    },
  ],
  questionEvaluations: [
    {
      questionId: 'q1-js-eventloop',
      questionText: 'What is the exact execution order of the console.log statements?',
      questionType: 'OUTPUT_PREDICTION',
      options: [
        { id: 'opt-a', text: '1, 2' },
        { id: 'opt-b', text: '2, 1' },
      ],
      selectedAnswers: ['opt-a'],
      correctAnswers: ['opt-a'],
      isCorrect: true,
      marksAwarded: 4,
      explanation: 'Synchronous execution precedes macrotask timers in the event loop.',
      skill: 'JavaScript',
    },
  ],
};

const mockReadinessReport: CareerReadinessReport = {
  overallScore: 85,
  statusBand: 'HIGHLY_JOB_READY',
  factors: [
    {
      name: 'Profile Completeness',
      category: 'Profile',
      weight: 20,
      score: 18,
      maxScore: 20,
      status: 'EXCELLENT',
      details: 'Career profile is 90% complete.',
    },
    {
      name: 'Verified Skills Assessment',
      category: 'Assessments',
      weight: 30,
      score: 24,
      maxScore: 30,
      status: 'EXCELLENT',
      details: '2 assessments passed with verified credentials.',
    },
    {
      name: 'Project Portfolio',
      category: 'Portfolio',
      weight: 20,
      score: 20,
      maxScore: 20,
      status: 'EXCELLENT',
      details: '2 projects documented with repository links.',
    },
    {
      name: 'Academic & Education Records',
      category: 'Education',
      weight: 15,
      score: 15,
      maxScore: 15,
      status: 'EXCELLENT',
      details: 'Academic records recorded including CGPA.',
    },
    {
      name: 'ATS Resume Availability',
      category: 'Resume',
      weight: 10,
      score: 10,
      maxScore: 10,
      status: 'EXCELLENT',
      details: 'Active ATS resume compiled and ready.',
    },
    {
      name: 'Certifications & Credentials',
      category: 'Certifications',
      weight: 5,
      score: 0,
      maxScore: 5,
      status: 'MISSING',
      details: 'No professional certifications added.',
    },
  ],
  missingFactors: ['Certifications: Add any industry certifications or bootcamps.'],
  improvementSuggestions: ['Upload proof or links for any technical certifications.'],
  assessmentVerifiedSkillsCount: 3,
  disclaimer:
    'Career Readiness Score is an automated heuristic metric reflecting profile completeness, portfolio evidence, and verified assessment scores. It does not guarantee employment or placement outcomes.',
  calculatedAt: new Date().toISOString(),
};

const mockSkillGapReport: SkillGapReport = {
  driveTitle: 'Full-Stack Software Engineer Drive',
  organizationName: 'Bharat Cloud Systems',
  requiredSkillsCount: 3,
  matchedSkillsCount: 2,
  missingSkillsCount: 1,
  matchPercentage: 67,
  skills: [
    {
      skill: 'JavaScript',
      status: 'ASSESSMENT_VERIFIED',
      importance: 'REQUIRED',
    },
    {
      skill: 'React',
      status: 'SELF_DECLARED',
      importance: 'REQUIRED',
      suggestedAssessmentId: 'asm-js-web-dev',
      suggestedAssessmentTitle: 'Full-Stack JavaScript & Web Development Assessment',
    },
    {
      skill: 'Docker',
      status: 'MISSING',
      importance: 'REQUIRED',
      suggestedAssessmentId: 'asm-cloud-devops',
      suggestedAssessmentTitle: 'Cloud Fundamentals & Docker',
      learningResources: ['Docker Getting Started Guide'],
    },
  ],
  learningPath: [
    'High Priority: Study fundamentals for missing required skills: Docker.',
    'Verification Priority: Validate your self-declared skills (React).',
  ],
};

const mockSmartMatchingReport: SmartMatchingReport = {
  eligibleOpportunities: [
    {
      drive: {
        id: 'drv-01',
        title: 'Junior Web Developer',
        description: 'Exciting web developer opportunity for rural college graduates.',
        organizationName: 'Innovate Bharat Technologies',
        opportunityType: 'JOB',
        workMode: 'REMOTE',
        status: 'PUBLISHED',
        applicationDeadline: '2026-11-30T18:00:00.000Z',
        requiredSkills: ['JavaScript', 'React'],
        createdBy: 'usr-emp-01',
        createdAt: '2026-10-29T18:00:00.000Z',
        updatedAt: '2026-10-29T18:00:00.000Z',
      },
      matchScore: 92,
      eligibility: {
        eligible: true,
        reasons: ['All criteria passed'],
        missingRequirements: [],
        checkedAt: new Date().toISOString(),
      },
      matchingFactors: [
        'JavaScript verified via Assessment (+bonus)',
        'React self-declared in profile',
        'Course and Graduation Year perfectly aligned',
      ],
      gaps: [],
      recommendedActions: [],
      isEligible: true,
      isPotentialMatch: false,
    },
  ],
  potentialMatches: [],
  ineligibleOpportunities: [],
  totalDrivesEvaluated: 1,
  studentReadinessScore: 85,
  studentVerifiedSkills: ['JavaScript'],
};

describe('Phase 6 Frontend Experience: Skill Assessment, Career Readiness & Smart Matching', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/api/skills/categories')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: ['Programming Languages', 'Web Development', 'Databases'],
              }),
          });
        }
        if (url.includes('/api/skills')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockSkills }),
          });
        }
        if (url.includes('/api/assessments/my-history')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [mockCompletedAttempt] }),
          });
        }
        if (url.includes('/api/assessments')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [mockAssessment] }),
          });
        }
        if (url.includes('/api/students/me/career-readiness')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockReadinessReport }),
          });
        }
        if (url.includes('/api/students/me/skill-gaps')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockSkillGapReport }),
          });
        }
        if (url.includes('/api/students/me/recommended-opportunities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockSmartMatchingReport }),
          });
        }
        if (url.includes('/api/opportunities')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: {} }),
        });
      })
    );
  });

  describe('1. Skills Explorer View', () => {
    it('renders skill taxonomy and filters by category', async () => {
      render(<SkillsExplorerView />);

      expect(await screen.findByText('Structured Skill Explorer')).toBeInTheDocument();
      expect(screen.getAllByText('JavaScript').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('React').length).toBeGreaterThanOrEqual(1);

      // Search input exists
      const searchInput = screen.getByPlaceholderText(/Search skills/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('2. Assessment Catalogue & Attempt Flow', () => {
    it('renders assessment cards and initiates attempt on click', async () => {
      const handleStartAttempt = vi.fn();
      const handleReviewAttempt = vi.fn();

      render(
        <AssessmentCatalogueView
          token="mock-token"
          onStartAttempt={handleStartAttempt}
          onReviewAttempt={handleReviewAttempt}
        />
      );

      expect(await screen.findByText('Full-Stack JavaScript & Web Development Assessment')).toBeInTheDocument();
      expect(screen.getByText('25 Minutes')).toBeInTheDocument();
      expect(screen.getByText('Pass: 65%')).toBeInTheDocument();

      const startBtn = screen.getByRole('button', { name: /Start Assessment/i });
      fireEvent.click(startBtn);

      await waitFor(() => {
        expect(handleStartAttempt).toHaveBeenCalled();
      });
    });

    it('switches to My Attempts tab to review past attempts', async () => {
      const handleReviewAttempt = vi.fn();
      render(
        <AssessmentCatalogueView
          token="mock-token"
          onStartAttempt={vi.fn()}
          onReviewAttempt={handleReviewAttempt}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/My Attempts/i)).toBeInTheDocument();
      });

      const myAttemptsTab = screen.getByText(/My Attempts/i);
      fireEvent.click(myAttemptsTab);

      expect(await screen.findByText(/Review Scorecard/i)).toBeInTheDocument();
      const reviewBtn = screen.getByText(/Review Scorecard/i);
      fireEvent.click(reviewBtn);

      expect(handleReviewAttempt).toHaveBeenCalledWith(mockCompletedAttempt);
    });
  });

  describe('3. Assessment Attempt Interface', () => {
    it('renders question, allows selecting options, and confirms submission', async () => {
      const handleFinishAttempt = vi.fn();

      render(
        <AssessmentAttemptView
          attempt={mockAttempt}
          assessment={mockAssessment}
          token="mock-token"
          onFinishAttempt={handleFinishAttempt}
          onExit={vi.fn()}
        />
      );

      expect(screen.getByText('What is the exact execution order of the console.log statements?')).toBeInTheDocument();
      expect(screen.getByText('+4 marks')).toBeInTheDocument();

      // Select an option
      const optionA = screen.getByText('1, 2');
      fireEvent.click(optionA);

      // Click submit test
      const submitBtn = screen.getByRole('button', { name: /Submit Test/i });
      fireEvent.click(submitBtn);

      // Verify confirmation modal
      expect(await screen.findByText('Submit Assessment?')).toBeInTheDocument();
      const confirmSubmitBtn = screen.getByRole('button', { name: /Yes, Submit Now/i });
      fireEvent.click(confirmSubmitBtn);

      await waitFor(() => {
        expect(handleFinishAttempt).toHaveBeenCalled();
      });
    });
  });

  describe('4. Assessment Result & Review Interface', () => {
    it('renders scorecard, skill breakdown, and explanation', () => {
      render(
        <AssessmentResultView
          attempt={mockCompletedAttempt}
          onBackToCatalogue={vi.fn()}
          onViewCareerReadiness={vi.fn()}
        />
      );

      expect(screen.getByText('Assessment Passed')).toBeInTheDocument();
      expect(screen.getAllByText('100%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Score: 20 / 20 Marks')).toBeInTheDocument();

      // Skill-wise breakdown
      expect(screen.getByText('Skill-Wise Performance Breakdown')).toBeInTheDocument();

      // Question review and explanation
      expect(screen.getByText('Why is this correct?')).toBeInTheDocument();
      expect(screen.getByText(/Synchronous execution precedes macrotask timers/i)).toBeInTheDocument();
    });
  });

  describe('5. Career Readiness Scorecard', () => {
    it('renders 6-pillar breakdown, status band, and employment disclaimer', async () => {
      render(<CareerReadinessView token="mock-token" />);

      expect(await screen.findByText('Career Readiness Scorecard')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('HIGHLY JOB READY')).toBeInTheDocument();

      // 6 Pillars
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getByText('Verified Skills Assessment')).toBeInTheDocument();
      expect(screen.getByText('Project Portfolio')).toBeInTheDocument();
      expect(screen.getByText('Academic & Education Records')).toBeInTheDocument();
      expect(screen.getByText('ATS Resume Availability')).toBeInTheDocument();
      expect(screen.getByText('Certifications & Credentials')).toBeInTheDocument();

      // Missing factors and suggestions
      expect(screen.getByText('Identified Score Gaps')).toBeInTheDocument();
      expect(screen.getByText(/Certifications: Add any industry certifications/i)).toBeInTheDocument();

      // Disclaimer
      expect(screen.getByText(/Official Disclaimer:/i)).toBeInTheDocument();
      expect(screen.getByText(/does not guarantee employment or placement outcomes/i)).toBeInTheDocument();
    });
  });

  describe('6. Skill Gap Analysis View', () => {
    it('renders verified vs self-declared vs missing badges and learning roadmap', async () => {
      render(<SkillGapView token="mock-token" />);

      expect(await screen.findByText('Skill Gap & Learning Pathways')).toBeInTheDocument();
      expect(screen.getByText('67%')).toBeInTheDocument(); // Match percentage

      // Badges
      expect(screen.getAllByText(/ASSESSMENT VERIFIED/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/SELF DECLARED/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/MISSING/i).length).toBeGreaterThanOrEqual(1);

      // Learning Path
      expect(screen.getByText(/Study fundamentals for missing required skills: Docker/i)).toBeInTheDocument();
    });
  });

  describe('7. Recommended Opportunities View', () => {
    it('renders smart matching opportunities with explainable factors', async () => {
      const handleApply = vi.fn();
      render(<RecommendedOpportunitiesView token="mock-token" onApplyToDrive={handleApply} />);

      expect(await screen.findByText('Smart Recommended Opportunities')).toBeInTheDocument();
      expect(screen.getByText('Junior Web Developer')).toBeInTheDocument();
      expect(screen.getByText('92% Match')).toBeInTheDocument();

      // Explainable matching factors
      expect(screen.getByText(/✓ JavaScript verified via Assessment/i)).toBeInTheDocument();
      expect(screen.getByText(/✓ Course and Graduation Year perfectly aligned/i)).toBeInTheDocument();

      // Apply button
      const applyBtn = screen.getByRole('button', { name: /Apply Now/i });
      fireEvent.click(applyBtn);
      expect(handleApply).toHaveBeenCalledWith('drv-01');
    });
  });
});
