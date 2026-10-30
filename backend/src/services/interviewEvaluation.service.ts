import {
  MockInterviewQuestionData,
  MockInterviewAnswerData,
  MockInterviewQuestionFeedback,
  MockInterviewSessionEvaluation,
} from '../types/index.js';
import { AiService } from './ai/ai.service.js';

export class InterviewEvaluationService {
  public static readonly RUBRIC_VERSION = 'v14.0';

  /**
   * Evaluates an entire mock interview session and returns structured, transparent feedback.
   */
  public static async evaluateSession(
    questions: MockInterviewQuestionData[],
    answers: MockInterviewAnswerData[]
  ): Promise<MockInterviewSessionEvaluation> {
    const aiService = AiService.getInstance();
    const isRealAi = aiService.isRealProviderConnected();

    const answerMap = new Map<string, MockInterviewAnswerData>();
    for (const ans of answers) {
      answerMap.set(ans.questionId, ans);
    }

    const questionFeedbacks: MockInterviewQuestionFeedback[] = [];
    const categoryTotals: Record<string, { totalScore: number; count: number }> = {};
    const globalStrengths: string[] = [];
    const globalImprovements: string[] = [];
    const globalNextSteps: string[] = [];

    for (const q of questions) {
      const studentAns = answerMap.get(q.id);
      const answerText = studentAns?.answerText?.trim() || '';

      const feedback = await this.evaluateSingleQuestion(q, answerText);
      questionFeedbacks.push(feedback);

      // Accumulate category stats
      const cat = q.category || 'TECHNICAL';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { totalScore: 0, count: 0 };
      }
      categoryTotals[cat].totalScore += feedback.score;
      categoryTotals[cat].count++;

      // Aggregate strengths and improvements
      if (feedback.strengths.length > 0) {
        globalStrengths.push(`${q.topic}: ${feedback.strengths[0]}`);
      }
      if (feedback.areasForImprovement.length > 0) {
        globalImprovements.push(`${q.topic}: ${feedback.areasForImprovement[0]}`);
      }
      if (feedback.missingConcepts.length > 0) {
        globalNextSteps.push(`Review core concepts in ${q.topic}: ${feedback.missingConcepts.join(', ')}.`);
      }
    }

    // Calculate overall average score
    const totalScoreSum = questionFeedbacks.reduce((acc, f) => acc + f.score, 0);
    const overallScore =
      questionFeedbacks.length > 0 ? Math.round(totalScoreSum / questionFeedbacks.length) : 0;

    const categoryScores: Record<string, number> = {};
    for (const [cat, data] of Object.entries(categoryTotals)) {
      categoryScores[cat] = data.count > 0 ? Math.round(data.totalScore / data.count) : 0;
    }

    if (globalNextSteps.length === 0) {
      globalNextSteps.push('Practice additional behavioral and role-specific mock sessions to reinforce interview fluency.');
    }

    return {
      overallScore,
      categoryScores,
      strengths: Array.from(new Set(globalStrengths)).slice(0, 4),
      improvementAreas: Array.from(new Set(globalImprovements)).slice(0, 4),
      questionFeedbacks,
      nextSteps: Array.from(new Set(globalNextSteps)).slice(0, 4),
      isFallback: !isRealAi,
      provider: aiService.getActiveProviderName(),
      rubricVersion: this.RUBRIC_VERSION,
      disclaimer:
        'Mock interview scores are advisory performance assessments generated for practice and reflection. They do not constitute actual corporate hiring decisions or guarantees of selection.',
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates a single question answer using question-specific rubrics.
   */
  public static async evaluateSingleQuestion(
    question: MockInterviewQuestionData,
    studentAnswer: string
  ): Promise<MockInterviewQuestionFeedback> {
    const cleanAnswer = studentAnswer.trim();

    // If answer is empty or skipped
    if (!cleanAnswer) {
      return {
        questionId: question.id,
        questionText: question.questionText,
        studentAnswer: '(No answer provided)',
        score: 0,
        strengths: [],
        areasForImprovement: ['Question was skipped or left blank. Strive to attempt every interview question.'],
        missingConcepts: question.expectedConcepts,
        suggestedApproach: question.suggestedApproach || 'Prepare a structured outline addressing the core problem definition.',
      };
    }

    const wordCount = cleanAnswer.split(/\s+/).filter(Boolean).length;
    let score = 50;
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const missingConcepts: string[] = [];

    // Length and depth assessment
    if (wordCount >= 40) {
      score += 15;
      strengths.push('Provided substantial detail with articulated reasoning.');
    } else if (wordCount >= 15) {
      score += 5;
      strengths.push('Concise initial statement provided.');
      areasForImprovement.push('Elaborate with deeper technical context and specific trade-offs.');
    } else {
      score -= 20;
      areasForImprovement.push('Answer is overly brief. In interviews, elaborate on your thinking process and implementation details.');
    }

    // Expected concepts coverage
    const lower = cleanAnswer.toLowerCase();
    let conceptsFound = 0;
    for (const concept of question.expectedConcepts || []) {
      const cLower = concept.toLowerCase();
      // Match keywords
      const terms = cLower.split(/\s+/).filter((t) => t.length > 2);
      const hasTerm = terms.some((t) => lower.includes(t));
      if (hasTerm) {
        conceptsFound++;
      } else {
        missingConcepts.push(concept);
      }
    }

    if (question.expectedConcepts && question.expectedConcepts.length > 0) {
      const coverageRatio = conceptsFound / question.expectedConcepts.length;
      score += Math.round(coverageRatio * 25);
      if (coverageRatio >= 0.6) {
        strengths.push(`Addressed core technical concepts (${conceptsFound}/${question.expectedConcepts.length} identified).`);
      } else {
        areasForImprovement.push(`Missing key domain concepts: ${missingConcepts.slice(0, 2).join(', ')}.`);
      }
    }

    // Category-specific rubric checks
    let starEvaluation: any = undefined;
    let codingEvaluation: any = undefined;

    if (question.category === 'BEHAVIORAL') {
      const hasSituation = lower.includes('situation') || lower.includes('project') || lower.includes('when') || lower.includes('team');
      const hasTask = lower.includes('task') || lower.includes('goal') || lower.includes('needed') || lower.includes('assigned');
      const hasAction = lower.includes('action') || lower.includes('implemented') || lower.includes('decided') || lower.includes('debugged') || lower.includes('step');
      const hasResult = lower.includes('result') || lower.includes('outcome') || lower.includes('learned') || lower.includes('improved') || lower.includes('delivered');

      const sScore = hasSituation ? 25 : 10;
      const tScore = hasTask ? 25 : 10;
      const aScore = hasAction ? 25 : 10;
      const rScore = hasResult ? 25 : 10;

      starEvaluation = {
        situationScore: sScore,
        taskScore: tScore,
        actionScore: aScore,
        resultScore: rScore,
      };

      if (hasAction && hasResult) {
        score += 10;
        strengths.push('Effectively demonstrated tangible actions and positive outcomes.');
      } else {
        areasForImprovement.push('Strengthen the narrative using STAR: explicitly highlight the Actions taken and quantifiable Results.');
      }
    } else if (question.questionType === 'CODING') {
      // SAFE CODE ANALYSIS (Static inspection only - NEVER executed in the main process)
      const hasLoopsOrMap = lower.includes('for') || lower.includes('while') || lower.includes('map') || lower.includes('reduce');
      const hasReturn = lower.includes('return');
      const hasComplexity = lower.includes('o(') || lower.includes('time') || lower.includes('space') || lower.includes('complexity');

      codingEvaluation = {
        correctnessScore: hasReturn ? 85 : 60,
        complexityExplanation: hasComplexity
          ? 'Complexity analyzed in submission.'
          : 'Consider explicitly analyzing Big-O time and space complexity.',
        codeQualityScore: hasLoopsOrMap && hasReturn ? 80 : 50,
      };

      if (hasReturn) {
        score += 10;
        strengths.push('Code structure includes explicit return values and modular logic.');
      }
      if (hasComplexity) {
        score += 5;
        strengths.push('Articulated computational complexity awareness.');
      } else {
        areasForImprovement.push('Always state the time and space complexity (Big-O notation) of your algorithmic solution.');
      }
    }

    const normalizedScore = Math.min(100, Math.max(10, Math.round(score)));

    return {
      questionId: question.id,
      questionText: question.questionText,
      studentAnswer: cleanAnswer,
      score: normalizedScore,
      strengths: strengths.length > 0 ? strengths : ['Attempted response with initial perspective.'],
      areasForImprovement:
        areasForImprovement.length > 0
          ? areasForImprovement
          : ['Review advanced edge cases to achieve an exceptional rating.'],
      missingConcepts: missingConcepts.slice(0, 3),
      suggestedApproach:
        question.suggestedApproach ||
        'Outline your solution starting with high-level constraints, proceed to implementation details, and verify with edge cases.',
      starEvaluation,
      codingEvaluation,
    };
  }
}
