import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { MockInterviewQuestionBankService } from '../services/interviewQuestionBank.service.js';
import { MockInterviewSessionService } from '../services/mockInterviewSession.service.js';
import { MockInterviewEvaluationService } from '../services/interviewEvaluation.service.js';
import { InterviewCoachService } from '../services/interviewCoach.service.js';
import { MockInterviewAnalyticsService } from '../services/interviewAnalytics.service.js';
import { MockInterviewSession } from '../models/mockInterviewSession.model.js';
import { InterviewQuestionBank } from '../models/interviewQuestionBank.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { Resume } from '../models/resume.model.js';
import { User } from '../models/user.model.js';

describe('Phase 14 — AI-Powered Interview Preparation, Mock Interviews & Evaluation Tests', () => {
  const app = createApp();

  describe('1. Question Bank Engine & Curated Categories', () => {
    it('should return curated default questions across multiple technical and behavioral categories', async () => {
      const dsaQuestions = await MockInterviewQuestionBankService.getQuestions({
        type: 'TECHNICAL_DSA',
        limit: 5,
      });

      expect(dsaQuestions).toBeDefined();
      expect(Array.isArray(dsaQuestions)).toBe(true);
      expect(dsaQuestions.length).toBeGreaterThan(0);
      expect(dsaQuestions[0].title).toBeDefined();
      expect(dsaQuestions[0].questionText).toBeDefined();
      expect(dsaQuestions[0].category).toBe('DSA');
    });

    it('should retrieve questions filtered by category and difficulty level', async () => {
      const hrQuestions = await MockInterviewQuestionBankService.getQuestions({
        type: 'HR_BEHAVIORAL',
        difficulty: 'INTERMEDIATE',
        limit: 5,
      });

      expect(hrQuestions).toBeDefined();
      expect(hrQuestions.length).toBeGreaterThan(0);
      expect(['HR', 'BEHAVIORAL']).toContain(hrQuestions[0].category);
      expect(hrQuestions[0].evaluationCriteria.length).toBeGreaterThan(0);
    });

    it('should allow admin to add, retrieve and archive custom questions', async () => {
      const newQuestion = await MockInterviewQuestionBankService.createQuestion({
        title: 'Reverse a Linked List in Python',
        category: 'DSA',
        type: 'TECHNICAL_DSA',
        difficulty: 'EASY',
        questionText: 'Given the head of a singly linked list, reverse the list and return its head.',
        starterCodeSnippet: 'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next',
        codingLanguage: 'python',
        evaluationCriteria: ['Time complexity O(N)', 'Space complexity O(1)', 'Null head boundary handling'],
        expectedKeyPoints: ['Iterative pointer reversal', 'Prev/curr/next pointer tracking'],
        hints: ['Keep track of the previous node while traversing forward.'],
        sampleAnswerApproach: 'Initialize prev as None and curr as head, then iterate updating pointers.',
        createdBy: 'admin_test_1',
      });

      expect(newQuestion).toBeDefined();
      expect(newQuestion.title).toBe('Reverse a Linked List in Python');
      expect(newQuestion.category).toBe('DSA');
      expect(newQuestion.isActive).toBe(true);

      const archived = await MockInterviewQuestionBankService.deleteQuestion(newQuestion.id);
      expect(archived).toBe(true);
    });
  });

  describe('2. Job-Description & Resume-Based Dynamic Question Generation', () => {
    it('should dynamically generate job-specific questions when placementDriveId is provided', async () => {
      // Mock PlacementDrive findById
      const mockDrive = {
        _id: 'drive_phase14_mock',
        title: 'Full Stack MERN Developer',
        organizationName: 'Bharat Cloud Systems',
        jobDescription: 'Building microservices with Node.js, Express, MongoDB, and React with TypeScript.',
        requiredSkills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
        preferredSkills: ['Redis', 'Docker'],
      };

      const spyFindById = vi.spyOn(PlacementDrive, 'findById').mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockDrive),
      } as any);

      const questions = await MockInterviewQuestionBankService.generateJobSpecificQuestions('drive_phase14_mock', 4);

      expect(questions).toBeDefined();
      expect(questions.length).toBe(4);
      expect(questions[0].category).toBe('JOB_DESCRIPTION');
      expect(questions[0].questionText).toContain('Full Stack MERN Developer');
      expect(questions[0].evaluationCriteria.length).toBeGreaterThan(0);

      spyFindById.mockRestore();
    });

    it('should dynamically generate resume-based questions based on student profile and projects', async () => {
      const mockUser = {
        _id: 'student_phase14_mock',
        name: 'Arjun Verma',
        studentProfile: {
          technicalSkills: ['React', 'Node.js', 'PostgreSQL'],
          projects: [
            {
              title: 'Rural Healthcare Telemedicine Platform',
              description: 'Created a low-bandwidth WebRTC video consultation tool for Tier-3 district hospitals.',
              technologies: ['React', 'WebRTC', 'Node.js'],
            },
          ],
          workExperiences: [
            {
              title: 'Frontend Intern',
              company: 'AgriTech Solutions',
              description: 'Optimized dashboard load time by 40% using code splitting.',
            },
          ],
        },
      };

      const spyUser = vi.spyOn(User, 'findById').mockReturnValue({
        exec: vi.fn().mockResolvedValue(mockUser),
      } as any);

      const questions = await MockInterviewQuestionBankService.generateResumeBasedQuestions({
        studentId: 'student_phase14_mock',
        targetRole: 'Full Stack Engineer',
        questionCount: 4,
      });

      expect(questions).toBeDefined();
      expect(questions.length).toBe(4);
      expect(questions[0].category).toBe('RESUME_PROJECT');
      expect(questions.some((q) => q.questionText.includes('Rural Healthcare Telemedicine Platform'))).toBe(true);

      spyUser.mockRestore();
    });
  });

  describe('3. Session Lifecycle, Time Constraints & Answer Autosave', () => {
    it('should enforce duration boundaries between 5 and 60 minutes', async () => {
      // Too short (< 5 mins)
      await expect(
        MockInterviewSessionService.createSession('student_1', {
          type: 'TECHNICAL_DSA',
          durationMinutes: 3,
        })
      ).rejects.toThrow(/Duration must be between 5 and 60 minutes/);

      // Too long (> 60 mins)
      await expect(
        MockInterviewSessionService.createSession('student_1', {
          type: 'TECHNICAL_DSA',
          durationMinutes: 90,
        })
      ).rejects.toThrow(/Duration must be between 5 and 60 minutes/);
    });

    it('should enforce question count between 1 and 15 questions', async () => {
      await expect(
        MockInterviewSessionService.createSession('student_1', {
          type: 'TECHNICAL_DSA',
          durationMinutes: 30,
          questionCount: 20,
        })
      ).rejects.toThrow(/Question count must be between 1 and 15/);
    });

    it('should transition session state from CREATED -> IN_PROGRESS on start', async () => {
      const mockCreatedSession = {
        _id: 'session_lifecycle_1',
        studentId: 'student_1',
        status: 'CREATED',
        durationMinutes: 30,
        questions: [{ questionId: 'q1', title: 'Two Sum' }],
        save: vi.fn().mockResolvedValue(true),
        toSafeObject: () => ({
          id: 'session_lifecycle_1',
          status: 'IN_PROGRESS',
          startedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1800000).toISOString(),
        }),
      };

      const spyFind = vi.spyOn(MockInterviewSession, 'findOne').mockResolvedValue(mockCreatedSession as any);

      const started = await MockInterviewSessionService.startSession('session_lifecycle_1', 'student_1');

      expect(mockCreatedSession.status).toBe('IN_PROGRESS');
      expect(mockCreatedSession.save).toHaveBeenCalled();
      expect(started.status).toBe('IN_PROGRESS');

      spyFind.mockRestore();
    });

    it('should autosave student answers and update isAnswered flag', async () => {
      const mockSession = {
        _id: 'session_autosave_1',
        studentId: 'student_1',
        status: 'IN_PROGRESS',
        questions: [
          { questionId: 'q_dsa_1', title: 'Two Sum' },
          { questionId: 'q_dsa_2', title: 'Binary Search' },
        ],
        answers: [],
        save: vi.fn().mockResolvedValue(true),
        toSafeObject: () => ({
          id: 'session_autosave_1',
          status: 'IN_PROGRESS',
          answers: [
            {
              questionId: 'q_dsa_1',
              answerText: 'We can use a hash map to find the complement in O(N) time.',
              timeSpentSeconds: 45,
              isAnswered: true,
            },
          ],
        }),
      };

      const spyFind = vi.spyOn(MockInterviewSession, 'findOne').mockResolvedValue(mockSession as any);

      const updated = await MockInterviewSessionService.saveAnswer('session_autosave_1', 'student_1', {
        questionId: 'q_dsa_1',
        answerText: 'We can use a hash map to find the complement in O(N) time.',
        timeSpentSeconds: 45,
      });

      expect(mockSession.save).toHaveBeenCalled();
      expect(mockSession.answers.length).toBe(1);
      expect(mockSession.answers[0].isAnswered).toBe(true);

      spyFind.mockRestore();
    });
  });

  describe('4. AI Evaluation Engine & Safe Static Code Analysis', () => {
    it('should safely evaluate code without executing student code in the backend process', async () => {
      const maliciousOrInfiniteLoopCode = `
        // Attempt infinite loop or process access
        while(true) { /* nothing */ }
        require('fs').readFileSync('/etc/passwd');
      `;

      const analysis = MockInterviewEvaluationService.safeStaticCodeAnalysis(
        maliciousOrInfiniteLoopCode,
        'javascript'
      );

      // Safe static analysis flags issues without crashing or freezing the Node process
      expect(analysis).toBeDefined();
      expect(analysis.syntaxValid).toBe(true);
      expect(analysis.estimatedTimeComplexity).toBeDefined();
      expect(analysis.codeQualityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.staticWarnings.some((w) => w.toLowerCase().includes('loop') || w.toLowerCase().includes('process') || w.toLowerCase().includes('require'))).toBe(true);
    });

    it('should detect linear time complexity and constant space for single loop solutions', () => {
      const solutionCode = `
        function findMax(arr) {
          let maxVal = arr[0];
          for (let i = 1; i < arr.length; i++) {
            if (arr[i] > maxVal) {
              maxVal = arr[i];
            }
          }
          return maxVal;
        }
      `;

      const analysis = MockInterviewEvaluationService.safeStaticCodeAnalysis(solutionCode, 'javascript');

      expect(analysis.syntaxValid).toBe(true);
      expect(analysis.estimatedTimeComplexity).toBe('O(N)');
      expect(analysis.estimatedSpaceComplexity).toBe('O(1)');
      expect(analysis.codeQualityScore).toBeGreaterThanOrEqual(75);
    });

    it('should evaluate behavioral questions using STAR methodology (Situation, Task, Action, Result)', async () => {
      const mockQuestion = {
        questionId: 'q_star_1',
        title: 'Handling Conflicting Team Priorities',
        questionText: 'Tell me about a time when you and a teammate disagreed on a technical choice.',
        category: 'BEHAVIORAL' as const,
        type: 'HR_BEHAVIORAL' as const,
        difficulty: 'INTERMEDIATE' as const,
        evaluationCriteria: ['Clarity of situation', 'Objective resolution', 'Action taken', 'Measurable outcome'],
        expectedKeyPoints: ['Listen to alternative viewpoints', 'Benchmark trade-offs', 'Reach consensus'],
        hints: ['Follow Situation, Task, Action, Result'],
        sampleAnswerApproach: 'Describe a project dispute, the benchmark tests run, and the collaborative resolution.',
      };

      const starAnswer = `
        Situation: During our final year capstone project, our team had a disagreement on whether to use MongoDB or PostgreSQL for storing structured telemetry.
        Task: As the backend lead, I was tasked with unifying the team's database decision within a 48-hour sprint.
        Action: I created a comparison benchmark comparing write throughput and relational integrity for our specific schema, and held a demo session where both sides presented pros and cons.
        Result: We mutually agreed on PostgreSQL with a JSONB column, saving 30% development time and delivering the project on schedule with zero schema errors.
      `;

      const feedback = await MockInterviewEvaluationService.evaluateAnswer(
        mockQuestion,
        starAnswer,
        undefined,
        'BEHAVIORAL'
      );

      expect(feedback).toBeDefined();
      expect(feedback.score).toBeGreaterThanOrEqual(75);
      expect(feedback.starBreakdown).toBeDefined();
      expect(feedback.starBreakdown?.situationPresent).toBe(true);
      expect(feedback.starBreakdown?.taskPresent).toBe(true);
      expect(feedback.starBreakdown?.actionPresent).toBe(true);
      expect(feedback.starBreakdown?.resultPresent).toBe(true);
      expect(feedback.strengths.length).toBeGreaterThan(0);
      expect(feedback.modelAnswerApproach).toBeDefined();
    });

    it('should provide deterministic fallback evaluation if AI provider fails or times out', async () => {
      const mockQuestion = {
        questionId: 'q_dsa_fallback',
        title: 'Two Sum Problem',
        questionText: 'Find two numbers that add up to a target.',
        category: 'DSA' as const,
        type: 'TECHNICAL_DSA' as const,
        difficulty: 'EASY' as const,
        evaluationCriteria: ['Optimal complexity', 'Corner cases'],
        expectedKeyPoints: ['Hash map lookup', 'Complement calculation'],
        hints: ['Use a hash map'],
        sampleAnswerApproach: 'Store seen values in a map.',
      };

      const fallback = MockInterviewEvaluationService.generateFallbackAnswerFeedback(
        mockQuestion,
        'I will use a hash map to look up target minus current element.',
        'function twoSum(nums, target) { const map = {}; }'
      );

      expect(fallback).toBeDefined();
      expect(fallback.score).toBeGreaterThanOrEqual(40);
      expect(fallback.score).toBeLessThanOrEqual(100);
      expect(fallback.strengths.length).toBeGreaterThan(0);
      expect(fallback.modelAnswerApproach).toBeDefined();
      expect(fallback.nextImprovementSteps.length).toBeGreaterThan(0);
    });
  });

  describe('5. Interactive AI Interview Coach (Practice vs Mock Mode Gating)', () => {
    const mockQuestion = {
      questionId: 'q_coach_1',
      title: 'LRU Cache Design',
      questionText: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.',
      category: 'DSA' as const,
      type: 'TECHNICAL_DSA' as const,
      difficulty: 'HARD' as const,
      evaluationCriteria: ['O(1) get and put', 'Doubly linked list with hash map'],
      expectedKeyPoints: ['Doubly linked list nodes', 'Hash map for constant lookup'],
      hints: ['A doubly linked list allows O(1) removal and insertion at head/tail.'],
      sampleAnswerApproach: 'Combine a hash map with a doubly linked list.',
    };

    it('should strictly deny hints in MOCK mode to simulate real exam pressure', async () => {
      const coachResponse = await InterviewCoachService.handleCoachQuery({
        mode: 'MOCK',
        queryType: 'HINT',
        question: mockQuestion,
      });

      expect(coachResponse).toBeDefined();
      expect(coachResponse.isAllowed).toBe(false);
      expect(coachResponse.reply).toContain('Mock Mode Exam Conditions');
      expect(coachResponse.reply).toContain('Hints and expected solution structures are restricted');
    });

    it('should provide guidance hints in PRACTICE mode', async () => {
      const coachResponse = await InterviewCoachService.handleCoachQuery({
        mode: 'PRACTICE',
        queryType: 'HINT',
        question: mockQuestion,
        currentAnswerDraft: 'I am thinking of using an array to track order.',
      });

      expect(coachResponse).toBeDefined();
      expect(coachResponse.isAllowed).toBe(true);
      expect(coachResponse.reply.length).toBeGreaterThan(20);
      expect(coachResponse.suggestedChecklist?.length).toBeGreaterThan(0);
    });

    it('should provide structure advice for behavioral questions in PRACTICE mode', async () => {
      const behavioralQuestion = {
        ...mockQuestion,
        category: 'BEHAVIORAL' as const,
        type: 'HR_BEHAVIORAL' as const,
      };

      const coachResponse = await InterviewCoachService.handleCoachQuery({
        mode: 'PRACTICE',
        queryType: 'STRUCTURE_ADVICE',
        question: behavioralQuestion,
      });

      expect(coachResponse).toBeDefined();
      expect(coachResponse.isAllowed).toBe(true);
      expect(coachResponse.reply).toContain('STAR');
      expect(coachResponse.suggestedChecklist).toContain('Situation: Context, team, and baseline challenge');
    });
  });

  describe('6. Analytics & Personalized Preparation Roadmaps', () => {
    it('should aggregate student interview analytics and compute topic-wise performance', async () => {
      const mockSessions = [
        {
          _id: 's1',
          studentId: 'student_analytics_test',
          status: 'COMPLETED',
          type: 'TECHNICAL_DSA',
          durationMinutes: 30,
          completedAt: new Date(),
          evaluation: {
            overallScore: 82,
            technicalCorrectnessScore: 85,
            codeQualityScore: 80,
            rubricBreakdown: { dsa: 85, algorithms: 80 },
            strengths: ['Optimal time complexity O(N)', 'Clear variable naming'],
            improvementAreas: ['Handle empty array edge cases'],
          },
          questions: [{ category: 'DSA' }],
        },
        {
          _id: 's2',
          studentId: 'student_analytics_test',
          status: 'COMPLETED',
          type: 'HR_BEHAVIORAL',
          durationMinutes: 20,
          completedAt: new Date(),
          evaluation: {
            overallScore: 78,
            communicationScore: 80,
            starStructureScore: 75,
            rubricBreakdown: { behavioral: 78 },
            strengths: ['Concise storytelling', 'Realistic conflict resolution'],
            improvementAreas: ['Quantify business results more clearly'],
          },
          questions: [{ category: 'BEHAVIORAL' }],
        },
      ];

      const spyFind = vi.spyOn(MockInterviewSession, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockSessions),
      } as any);

      const analytics = await MockInterviewAnalyticsService.getStudentAnalytics('student_analytics_test');

      expect(analytics).toBeDefined();
      expect(analytics.totalSessionsCompleted).toBe(2);
      expect(analytics.averageOverallScore).toBe(80);
      expect(analytics.categoryPerformance['TECHNICAL_DSA']).toBeDefined();
      expect(analytics.categoryPerformance['TECHNICAL_DSA'].averageScore).toBe(82);
      expect(analytics.commonStrengths.length).toBeGreaterThan(0);
      expect(analytics.recommendedFocusAreas.length).toBeGreaterThan(0);

      spyFind.mockRestore();
    });

    it('should generate personalized preparation roadmaps based on student weakest areas', async () => {
      const mockSessions = [
        {
          _id: 's1',
          studentId: 'student_roadmap_test',
          status: 'COMPLETED',
          type: 'TECHNICAL_DSA',
          durationMinutes: 30,
          completedAt: new Date(),
          evaluation: {
            overallScore: 45, // Weak DSA score
            technicalCorrectnessScore: 40,
            codeQualityScore: 50,
            strengths: ['Good pseudocode formulation'],
            improvementAreas: ['Recursion base cases', 'Time complexity analysis'],
          },
          questions: [{ category: 'DSA' }],
        },
      ];

      const spyFind = vi.spyOn(MockInterviewSession, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockSessions),
      } as any);

      const roadmap = await MockInterviewAnalyticsService.getPersonalizedRoadmap('student_roadmap_test');

      expect(roadmap).toBeDefined();
      expect(roadmap.studentId).toBe('student_roadmap_test');
      expect(roadmap.targetReadinessScore).toBeGreaterThanOrEqual(80);
      expect(roadmap.milestones.length).toBeGreaterThan(0);
      expect(roadmap.milestones[0].priority).toBe('HIGH');
      expect(roadmap.milestones[0].category).toBe('DSA');

      spyFind.mockRestore();
    });

    it('should generate college-level interview readiness reports with student privacy protection', async () => {
      const mockStudents = [
        { _id: 'std_c1' },
        { _id: 'std_c2' },
      ];

      const mockCollegeSessions = [
        {
          studentId: 'std_c1',
          status: 'COMPLETED',
          type: 'TECHNICAL_WEB',
          evaluation: {
            overallScore: 76,
            strengths: ['Clean component hierarchy'],
            improvementAreas: ['State management efficiency'],
          },
        },
        {
          studentId: 'std_c2',
          status: 'COMPLETED',
          type: 'TECHNICAL_DSA',
          evaluation: {
            overallScore: 84,
            strengths: ['Optimal Big-O design'],
            improvementAreas: ['Edge-case testing'],
          },
        },
      ];

      const spyUserFind = vi.spyOn(User, 'find').mockReturnValue({
        select: vi.fn().mockResolvedValue(mockStudents),
      } as any);

      const spySessionFind = vi.spyOn(MockInterviewSession, 'find').mockResolvedValue(mockCollegeSessions as any);

      const collegeReport = await MockInterviewAnalyticsService.getCollegeInterviewAnalytics('college_123');

      expect(collegeReport).toBeDefined();
      expect(collegeReport.collegeId).toBe('college_123');
      expect(collegeReport.totalStudentsParticipating).toBe(2);
      expect(collegeReport.totalSessionsCompleted).toBe(2);
      expect(collegeReport.averageReadinessScore).toBe(80);
      expect(collegeReport.topStrengths.length).toBeGreaterThan(0);
      expect(collegeReport.topImprovementAreas.length).toBeGreaterThan(0);

      // Verify privacy: individual student IDs and transcripts are NOT exposed in college report
      expect((collegeReport as any).studentAnswers).toBeUndefined();
      expect((collegeReport as any).sessions).toBeUndefined();

      spyUserFind.mockRestore();
      spySessionFind.mockRestore();
    });
  });

  describe('7. API Security, RBAC & Endpoints Protection', () => {
    it('GET /api/interviews/sessions should require authentication (401)', async () => {
      const res = await request(app).get('/api/interviews/sessions');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/interviews/sessions should require authentication (401)', async () => {
      const res = await request(app).post('/api/interviews/sessions').send({
        type: 'TECHNICAL_DSA',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/interviews/analytics should require authentication (401)', async () => {
      const res = await request(app).get('/api/interviews/analytics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/interviews/roadmap should require authentication (401)', async () => {
      const res = await request(app).get('/api/interviews/roadmap');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/interviews/college/analytics should require authentication (401)', async () => {
      const res = await request(app).get('/api/interviews/college/analytics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/interviews/admin/questions should require authentication (401)', async () => {
      const res = await request(app).get('/api/interviews/admin/questions');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/interviews/admin/analytics should require authentication (401)', async () => {
      const res = await request(app).get('/api/interviews/admin/analytics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
