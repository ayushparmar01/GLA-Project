import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { LearningRecommendationService } from '../services/learningRecommendation.service.js';
import { LearningProgressService } from '../services/learningProgress.service.js';
import { LearningQuizService } from '../services/learningQuiz.service.js';
import { LearningHubService } from '../services/learningHub.service.js';
import {
  SEED_PHASE17_RESOURCES,
  SEED_LEARNING_PATHS,
  SEED_LEARNING_QUIZZES,
} from '../config/learningHub.seed.js';

describe('Phase 17 — Advanced Learning & Resource Hub Test Suite', () => {
  const app = createApp();

  describe('1. 5-Pillar Explainable Recommendation Engine', () => {
    const studentProfile = {
      preferredJobRoles: ['Full Stack Web Developer'],
      skills: ['JavaScript', 'HTML5 & CSS3'],
      technicalSkills: ['JavaScript'],
      careerObjective: 'Aspiring Full Stack Engineer aiming to work with React and Node.js',
      headline: 'Full Stack Enthusiast',
      profileCompletionScore: 75,
    };

    const identifiedSkillGaps = ['React', 'Node.js', 'SQL'];

    it('should calculate 5-pillar composite recommendation scores totaling 100% maximum', () => {
      const recommendations = LearningRecommendationService.getInstance().calculateRecommendations(
        SEED_PHASE17_RESOURCES,
        studentProfile,
        identifiedSkillGaps,
        5
      );

      expect(recommendations.length).toBeGreaterThan(0);
      const topRec = recommendations[0];
      expect(topRec.matchScore).toBeGreaterThanOrEqual(70);
      expect(topRec.matchScore).toBeLessThanOrEqual(100);

      // Verify 5 pillars exist with exact weights
      expect(topRec.pillars.length).toBe(5);
      const pillarNames = topRec.pillars.map((p) => p.name);
      expect(pillarNames).toContain('Career Goal Match');
      expect(pillarNames).toContain('Skill Gap Addressed');
      expect(pillarNames).toContain('Industry Placement Demand');
      expect(pillarNames).toContain('Difficulty Suitability');
      expect(pillarNames).toContain('Learning Format Efficiency');

      // Check max scores sum to 100
      const totalWeight = topRec.pillars.reduce((acc, p) => acc + p.maxScore, 0);
      expect(totalWeight).toBe(100);

      // Check actual sum matches total matchScore
      const actualSum = topRec.pillars.reduce((acc, p) => acc + p.score, 0);
      expect(topRec.matchScore).toBe(Math.min(100, actualSum));
    });

    it('should prioritize resources bridging identified skill gaps', () => {
      const recommendations = LearningRecommendationService.getInstance().calculateRecommendations(
        SEED_PHASE17_RESOURCES,
        studentProfile,
        ['React'],
        10
      );

      // At least one top recommendation should address React
      const reactRec = recommendations.find(
        (r) =>
          r.resource.skill.toLowerCase().includes('react') ||
          (r.resource.skills || []).some((s) => s.toLowerCase().includes('react'))
      );
      expect(reactRec).toBeDefined();
      expect(reactRec?.pillars.find((p) => p.name === 'Skill Gap Addressed')?.score).toBe(30);
    });

    it('should map student skill gaps to curated learning paths and bridging resources', () => {
      const mapping = LearningRecommendationService.getInstance().mapSkillGapsToLearning(
        [
          { skill: 'React', status: 'MISSING', source: 'ASSESSMENT' },
          { skill: 'Node.js', status: 'MISSING', source: 'RESUME' },
        ],
        SEED_LEARNING_PATHS.map((p) => p.path as any),
        SEED_PHASE17_RESOURCES
      );

      expect(mapping.length).toBe(2);
      expect(mapping[0].skill).toBe('React');
      expect(mapping[0].recommendedPaths.length).toBeGreaterThan(0);
      expect(mapping[0].recommendedResources.length).toBeGreaterThan(0);
    });
  });

  describe('2. Resource Library Multi-Dimensional Filtering', () => {
    it('should filter resources by 10 supported types', async () => {
      const docRes = await LearningHubService.getInstance().listResources({
        resourceType: 'Documentation',
      });
      expect(docRes.resources.every((r) => r.resourceType === 'Documentation')).toBe(true);

      const videoRes = await LearningHubService.getInstance().listResources({
        resourceType: 'Video Tutorials',
      });
      expect(videoRes.resources.every((r) => r.resourceType === 'Video Tutorials')).toBe(true);

      const coursesRes = await LearningHubService.getInstance().listResources({
        resourceType: 'Courses',
      });
      expect(coursesRes.resources.every((r) => r.resourceType === 'Courses')).toBe(true);
    });

    it('should filter resources by difficulty level and category', async () => {
      const beginnerRes = await LearningHubService.getInstance().listResources({
        difficulty: 'BEGINNER',
      });
      expect(beginnerRes.resources.every((r) => r.difficulty === 'BEGINNER')).toBe(true);

      const webRes = await LearningHubService.getInstance().listResources({
        category: 'Web Development',
      });
      expect(
        webRes.resources.every((r) => (r.category || '').toLowerCase().includes('web'))
      ).toBe(true);
    });

    it('should support search keywords across titles, descriptions, and providers', async () => {
      const searchRes = await LearningHubService.getInstance().listResources({
        search: 'JavaScript',
      });
      expect(searchRes.resources.length).toBeGreaterThan(0);
      expect(
        searchRes.resources.some((r) =>
          r.title.toLowerCase().includes('javascript') ||
          (r.skills || []).some((s) => s.toLowerCase().includes('javascript'))
        )
      ).toBe(true);
    });
  });

  describe('3. Learning Path Enrollment & Sequential Module Progression', () => {
    const studentId = 'student-test-p17';
    const pathId = 'path-full-stack';

    it('should enroll a student in a learning path and prevent duplicate enrollment duplication', async () => {
      const firstEnroll = await LearningProgressService.getInstance().enrollStudent(
        studentId,
        pathId
      );
      expect(firstEnroll.isNew).toBe(true);
      expect(firstEnroll.enrollment.status).toBe('IN_PROGRESS');
      expect(firstEnroll.enrollment.progressPercentage).toBe(0);

      // Attempt second enrollment
      const secondEnroll = await LearningProgressService.getInstance().enrollStudent(
        studentId,
        pathId
      );
      expect(secondEnroll.isNew).toBe(false);
      expect(secondEnroll.enrollment.id).toBe(firstEnroll.enrollment.id);
    });

    it('should calculate module progress and update enrollment percentage accordingly', async () => {
      const progressResult = await LearningProgressService.getInstance().updateModuleProgress(
        studentId,
        pathId,
        'mod-fs-1',
        'COMPLETED',
        'STUDENT_CONFIRMED',
        undefined,
        'Finished foundational ES6 exercises'
      );

      expect(progressResult.moduleProgress.status).toBe('COMPLETED');
      expect(progressResult.enrollment.completedModulesCount).toBeGreaterThan(0);
      expect(progressResult.enrollment.progressPercentage).toBeGreaterThan(0);
    });
  });

  describe('4. Personal Library Bookmarks & Notes Isolation', () => {
    const studentId = 'student-bm-p17';
    const resourceId = 'res-mdn-js';

    it('should toggle bookmarks and save private notes', async () => {
      // 1. Add bookmark with note
      const bookmarkResult = await LearningHubService.getInstance().toggleBookmark(
        studentId,
        resourceId,
        'Review arrow functions and closure scope before interview',
        'Interview Notes'
      );

      expect(bookmarkResult.isBookmarked).toBe(true);
      expect(bookmarkResult.bookmark?.personalNote).toContain('Review arrow functions');

      // 2. Fetch bookmarks
      const bookmarks = await LearningHubService.getInstance().getStudentBookmarks(studentId);
      expect(bookmarks.some((b) => b.resourceId === resourceId)).toBe(true);
      expect(bookmarks.find((b) => b.resourceId === resourceId)?.personalNote).toContain(
        'Review arrow functions'
      );

      // 3. Toggle off
      const removeResult = await LearningHubService.getInstance().toggleBookmark(
        studentId,
        resourceId
      );
      expect(removeResult.isBookmarked).toBe(false);
    });
  });

  describe('5. Knowledge Check Quizzes with Server-Side Evaluation', () => {
    it('should return sanitized questions with answer keys omitted for clients', async () => {
      const quiz = await LearningQuizService.getInstance().getQuizById('quiz-js-basics');
      expect(quiz).toBeDefined();
      expect(quiz?.title).toContain('JavaScript');
      expect(quiz?.questions.length).toBeGreaterThan(0);

      // Verify answers are stripped
      for (const q of quiz!.questions) {
        expect(q.correctOptionId).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      }
    });

    it('should grade quiz answers on the server and return score with explanations', async () => {
      const studentId = 'student-quiz-test';
      const answers = {
        q1: 'opt-a', // correct
        q2: 'opt-b', // correct
        q3: 'opt-b', // correct
      };

      const attempt = await LearningQuizService.getInstance().evaluateQuiz(
        studentId,
        'quiz-js-basics',
        answers,
        'path-full-stack'
      );

      expect(attempt.score).toBe(100);
      expect(attempt.passed).toBe(true);
      expect(attempt.correctCount).toBe(3);
      expect(attempt.evaluations.length).toBe(3);
      expect(attempt.evaluations.every((e) => e.isCorrect)).toBe(true);
      expect(attempt.evaluations[0].explanation).toBeDefined();
    });

    it('should correctly handle failed quiz attempts without granting completion', async () => {
      const studentId = 'student-quiz-fail';
      const incorrectAnswers = {
        q1: 'opt-c', // wrong
        q2: 'opt-a', // wrong
        q3: 'opt-d', // wrong
      };

      const attempt = await LearningQuizService.getInstance().evaluateQuiz(
        studentId,
        'quiz-js-basics',
        incorrectAnswers
      );

      expect(attempt.score).toBe(0);
      expect(attempt.passed).toBe(false);
      expect(attempt.correctCount).toBe(0);
    });
  });

  describe('6. Resource Quality Reporting & Admin Moderation', () => {
    const studentId = 'student-report-p17';
    const resourceId = 'res-mdn-js';

    it('should allow student to submit resource defect report', async () => {
      const report = await LearningHubService.getInstance().reportResource(
        studentId,
        resourceId,
        'BROKEN_LINK',
        'Official link redirects with 404 in my region'
      );

      expect(report.id).toBeDefined();
      expect(report.status).toBe('PENDING');
      expect(report.reason).toBe('BROKEN_LINK');
    });

    it('should allow admin to resolve or dismiss reports', async () => {
      const report = await LearningHubService.getInstance().reportResource(
        studentId,
        resourceId,
        'OUTDATED_CONTENT',
        'Syntax refers to older ECMAScript'
      );

      const resolved = await LearningHubService.getInstance().resolveReport(
        report.id,
        'RESOLVED',
        'Updated to latest ECMAScript reference'
      );

      expect(resolved?.status).toBe('RESOLVED');
      expect(resolved?.adminNotes).toContain('Updated to latest');
    });
  });

  describe('7. College Institutional Learning Analytics (Privacy Guarded)', () => {
    it('should generate institutional metrics without student PII or personal notes', async () => {
      const analytics = await LearningHubService.getInstance().getCollegeAnalytics('college-test-id');

      expect(analytics).toBeDefined();
      expect(analytics.totalStudentsActive).toBeGreaterThanOrEqual(0);
      expect(analytics.totalEnrollments).toBeGreaterThanOrEqual(0);
      expect(analytics.topEnrolledPaths.length).toBeGreaterThan(0);
      expect(analytics.topLearnedSkills.length).toBeGreaterThan(0);

      // Verify no private notes leaked
      expect((analytics as any).personalNotes).toBeUndefined();
      expect((analytics as any).studentEmails).toBeUndefined();
    });
  });

  describe('8. API Endpoint RBAC Protection & Versioning', () => {
    it('should return valid API version and phase info from root endpoint', async () => {
      const res = await request(app).get('/api');
      expect(res.status).toBe(200);
      expect(res.body.version).toMatch(/^0\.(17|18)\.0$/);
      expect(res.body.phase).toMatch(/Phase (17|18)/);
    });

    it('should require authentication for student learning dashboard (401)', async () => {
      const res = await request(app).get('/api/learning/dashboard');
      expect(res.status).toBe(401);
    });

    it('should require authentication for bookmarks (401)', async () => {
      const res = await request(app).get('/api/learning/bookmarks');
      expect(res.status).toBe(401);
    });

    it('should allow public access to browse learning paths and resources', async () => {
      const pathsRes = await request(app).get('/api/learning/paths');
      expect(pathsRes.status).toBe(200);
      expect(Array.isArray(pathsRes.body.data)).toBe(true);

      const resRes = await request(app).get('/api/learning/resources');
      expect(resRes.status).toBe(200);
      expect(Array.isArray(resRes.body.data)).toBe(true);
    });

    it('should reject unauthenticated requests to admin learning endpoints (401)', async () => {
      const res = await request(app).get('/api/learning/admin/reports');
      expect(res.status).toBe(401);

      const seedRes = await request(app).post('/api/learning/admin/seed');
      expect(seedRes.status).toBe(401);
    });
  });
});
