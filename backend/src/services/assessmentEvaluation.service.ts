import { IAssessment, IAssessmentQuestion } from '../models/assessment.model.js';
import {
  QuestionEvaluation,
  SkillWiseResult,
} from '../types/index.js';

export interface EvaluationResult {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  isExpired: boolean;
  questionEvaluations: QuestionEvaluation[];
  skillWiseResults: SkillWiseResult[];
}

export class AssessmentEvaluationService {
  /**
   * Grace period in milliseconds (2 minutes) for network jitter or last-second submission.
   */
  private static readonly GRACE_PERIOD_MS = 2 * 60 * 1000;

  /**
   * Evaluates answers submitted for an assessment against its question definitions.
   */
  public static evaluate(
    assessment: IAssessment,
    answers: Record<string, string[]>,
    startedAt: Date,
    submissionTime: Date = new Date()
  ): EvaluationResult {
    // 1. Time / Expiration check
    const allowedDurationMs = assessment.durationMinutes * 60 * 1000;
    const elapsedMs = submissionTime.getTime() - startedAt.getTime();
    const isExpired = elapsedMs > allowedDurationMs + this.GRACE_PERIOD_MS;

    const questions: IAssessmentQuestion[] = assessment.questions || [];
    let totalScore = 0;
    const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

    const questionEvaluations: QuestionEvaluation[] = [];
    const skillMap = new Map<
      string,
      { totalQuestions: number; correctQuestions: number; score: number; maxScore: number }
    >();

    for (const q of questions) {
      const qId = q.questionId || (q as unknown as { id?: string }).id || '';
      const selectedAnswers = answers[qId] || [];
      const correctAnswers = q.correctAnswers || [];
      const skillName = q.skill || assessment.category;

      // Initialize skill tracking
      if (!skillMap.has(skillName)) {
        skillMap.set(skillName, {
          totalQuestions: 0,
          correctQuestions: 0,
          score: 0,
          maxScore: 0,
        });
      }
      const skillStats = skillMap.get(skillName)!;
      skillStats.totalQuestions += 1;
      skillStats.maxScore += q.marks;

      // Evaluation logic:
      // For MCQ / OUTPUT_PREDICTION / DEBUGGING / CONCEPTUAL: exactly one correct answer
      // For MULTIPLE_SELECT: sets of selected and correct must match exactly
      const sortedSelected = [...selectedAnswers].sort();
      const sortedCorrect = [...correctAnswers].sort();

      const isCorrect =
        sortedSelected.length > 0 &&
        sortedSelected.length === sortedCorrect.length &&
        sortedSelected.every((val, idx) => val === sortedCorrect[idx]);

      let marksAwarded = 0;
      if (isCorrect) {
        marksAwarded = q.marks;
        skillStats.correctQuestions += 1;
      } else if (selectedAnswers.length > 0 && q.negativeMarks) {
        marksAwarded = -q.negativeMarks;
      }

      totalScore += marksAwarded;
      skillStats.score += marksAwarded;

      questionEvaluations.push({
        questionId: qId,
        questionText: q.questionText,
        questionType: q.questionType,
        codeSnippet: q.codeSnippet,
        options: q.options || [],
        selectedAnswers,
        correctAnswers,
        isCorrect,
        marksAwarded,
        explanation: q.explanation || 'No explanation provided.',
        skill: skillName,
      });
    }

    // Floor total score at 0
    totalScore = Math.max(0, totalScore);

    // Aggregate skill-wise results
    const skillWiseResults: SkillWiseResult[] = [];
    for (const [skill, stats] of skillMap.entries()) {
      const clampedScore = Math.max(0, stats.score);
      const percentage =
        stats.maxScore > 0 ? Math.round((clampedScore / stats.maxScore) * 100) : 0;
      skillWiseResults.push({
        skill,
        totalQuestions: stats.totalQuestions,
        correctQuestions: stats.correctQuestions,
        score: clampedScore,
        maxScore: stats.maxScore,
        percentage,
      });
    }

    const percentage =
      totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
    const passed = percentage >= assessment.passingPercentage;

    return {
      score: totalScore,
      totalMarks,
      percentage,
      passed,
      isExpired,
      questionEvaluations,
      skillWiseResults,
    };
  }
}
