import { describe, it, expect } from 'vitest';
import { v4 as uuidv4, validate as uuidValidate, version as uuidVersion } from 'uuid';
import { LearningHubService } from './services/learningHub.service.js';
import { LearningProgressService } from './services/learningProgress.service.js';
import { LearningQuizService } from './services/learningQuiz.service.js';

describe('UUID Dependency & Integration Verification', () => {
  it('should import and generate standard RFC 4122 v4 UUIDs', () => {
    const id = uuidv4();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(36);
    expect(uuidValidate(id)).toBe(true);
    expect(uuidVersion(id)).toBe(4);
  });

  it('should generate unique UUID values on consecutive calls', () => {
    const id1 = uuidv4();
    const id2 = uuidv4();
    expect(id1).not.toBe(id2);
  });

  it('should format truncated IDs for Learning Hub entities properly', () => {
    const rawUuid = uuidv4();
    const prefix = `bm-${rawUuid.slice(0, 8)}`;
    expect(prefix).toMatch(/^bm-[0-9a-f]{8}$/);
  });

  it('should allow LearningHubService to be initialized and invoked without runtime errors', async () => {
    const service = LearningHubService.getInstance();
    expect(service).toBeDefined();

    // Test in-memory bookmark creation which invokes uuidv4()
    const result = await service.toggleBookmark('test-student-id-123', 'res-react-basics', 'Notes', 'Tech');
    expect(result).toBeDefined();
    expect(result.isBookmarked).toBe(true);
    expect(result.bookmark?.id).toMatch(/^bm-[0-9a-f]{8}$/);
  });

  it('should allow LearningProgressService to be initialized and invoked without runtime errors', async () => {
    const progressService = LearningProgressService.getInstance();
    expect(progressService).toBeDefined();

    // Test in-memory enrollment which invokes uuidv4()
    const enrollmentResult = await progressService.enrollStudent('test-student-id-123', 'path-frontend-dev');
    expect(enrollmentResult).toBeDefined();
    expect(enrollmentResult.enrollment.id).toMatch(/^enr-[0-9a-f]{8}$/);
  });

  it('should allow LearningQuizService to evaluate attempts using uuidv4() without runtime errors', async () => {
    const quizService = LearningQuizService.getInstance();
    expect(quizService).toBeDefined();

    const evaluation = await quizService.submitQuizAttempt('test-student-id-123', 'quiz-frontend-foundations', [
      { questionId: 'q-html-1', selectedOptionId: 'opt-2' },
      { questionId: 'q-css-1', selectedOptionId: 'opt-2' },
      { questionId: 'q-js-1', selectedOptionId: 'opt-2' }
    ]);
    expect(evaluation).toBeDefined();
    expect(evaluation.id).toMatch(/^att-[0-9a-f]{8}$/);
  });
});
