import { v4 as uuidv4 } from 'uuid';
import { LearningQuiz } from '../models/learningQuiz.model.js';
import { LearningQuizAttempt } from '../models/learningQuizAttempt.model.js';
import { SEED_LEARNING_QUIZZES } from '../config/learningHub.seed.js';
import {
  LearningQuizData,
  LearningQuizAttemptData,
  QuizQuestionEvaluation,
} from '../types/index.js';
import { getDbStatus } from '../config/db.js';
import { LearningProgressService } from './learningProgress.service.js';

const inMemoryQuizAttempts = new Map<string, LearningQuizAttemptData>();

export class LearningQuizService {
  private static instance: LearningQuizService;

  public static getInstance(): LearningQuizService {
    if (!LearningQuizService.instance) {
      LearningQuizService.instance = new LearningQuizService();
    }
    return LearningQuizService.instance;
  }

  /**
   * Get sanitized quiz for student (answers stripped)
   */
  public async getQuizById(quizId: string): Promise<LearningQuizData | null> {
    const isDbConnected = getDbStatus().status === 'connected';

    if (isDbConnected) {
      try {
        const quizDoc = await LearningQuiz.findOne({ quizId });
        if (quizDoc) {
          return quizDoc.toSafeObject(false);
        }
      } catch (err) {
        // Fall back
      }
    }

    // In-memory fallback
    const seed = SEED_LEARNING_QUIZZES.find((q) => q.id === quizId);
    if (!seed) return null;

    return {
      ...seed,
      questions: seed.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        options: q.options,
      })),
    };
  }

  /**
   * Submit and evaluate quiz on server
   */
  public async evaluateQuiz(
    studentId: string,
    quizId: string,
    submittedAnswers: Record<string, string>,
    learningPathId?: string
  ): Promise<LearningQuizAttemptData> {
    let quiz: LearningQuizData | null = null;
    let fullQuestions: Array<{
      id: string;
      questionText: string;
      options: Array<{ id: string; text: string }>;
      correctOptionId: string;
      explanation: string;
    }> = [];

    const isDbConnected = getDbStatus().status === 'connected';

    if (isDbConnected) {
      try {
        const quizDoc = await LearningQuiz.findOne({ quizId });
        if (quizDoc) {
          quiz = quizDoc.toSafeObject(true);
          fullQuestions = quizDoc.questions as any;
        }
      } catch (err) {
        // Fall back
      }
    }

    if (!quiz) {
      const seed = SEED_LEARNING_QUIZZES.find((q) => q.id === quizId);
      if (seed) {
        quiz = seed;
        fullQuestions = seed.questions as any;
      }
    }

    if (!quiz || fullQuestions.length === 0) {
      throw new Error(`Quiz with id '${quizId}' not found`);
    }

    let correctCount = 0;
    const evaluations: QuizQuestionEvaluation[] = [];

    for (const q of fullQuestions) {
      const selected = submittedAnswers[q.id] || '';
      const isCorrect = selected === q.correctOptionId;
      if (isCorrect) correctCount++;

      evaluations.push({
        questionId: q.id,
        questionText: q.questionText,
        selectedOptionId: selected,
        correctOptionId: q.correctOptionId,
        isCorrect,
        explanation: q.explanation || 'No explanation provided.',
      });
    }

    const totalQuestions = fullQuestions.length;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const passed = score >= (quiz.passingScore || 70);

    const attemptId = `att-${uuidv4().slice(0, 8)}`;
    const attemptData: LearningQuizAttemptData = {
      id: attemptId,
      studentId,
      quizId,
      quizTitle: quiz.title,
      score,
      totalQuestions,
      correctCount,
      passed,
      answers: submittedAnswers,
      evaluations,
      attemptedAt: new Date().toISOString(),
    };

    if (isDbConnected) {
      try {
        const attemptDoc = new LearningQuizAttempt({
          attemptId,
          studentId,
          quizId,
          score,
          totalQuestions,
          correctCount,
          passed,
          answers: submittedAnswers,
          evaluations,
          attemptedAt: new Date(),
        });
        await attemptDoc.save();
      } catch (err) {
        // Fall back to in-memory
      }
    }

    inMemoryQuizAttempts.set(attemptId, attemptData);

    // If passed and associated with a learning path & module, update progress!
    if (passed && learningPathId && quiz.moduleId) {
      try {
        await LearningProgressService.getInstance().updateModuleProgress(
          studentId,
          learningPathId,
          quiz.moduleId,
          'COMPLETED',
          'QUIZ_VERIFIED',
          score,
          `Passed quiz '${quiz.title}' with score ${score}%`
        );
      } catch {
        // Ignore progress sync errors
      }
    }

    return attemptData;
  }
}
