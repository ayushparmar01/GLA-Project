import {
  InterviewPracticeQuestion,
  InterviewFeedbackReport,
  InterviewTypeCategory,
} from '../types/index.js';
import { AiService } from './ai/ai.service.js';

export const CURATED_INTERVIEW_QUESTIONS: InterviewPracticeQuestion[] = [
  // 1. Technical
  {
    id: 'iq-tech-01',
    role: 'Full-Stack Software Engineer',
    category: 'TECHNICAL',
    questionText: 'Explain the difference between SQL transactions (ACID properties) and eventual consistency in distributed systems.',
    context: 'Assesses architectural understanding of transactional guarantees versus distributed availability trade-offs (CAP theorem).',
    sampleAnswerGuidelines: [
      'Define ACID (Atomicity, Consistency, Isolation, Durability)',
      'Explain Eventual Consistency in distributed data stores (e.g. Cassandra/MongoDB replicas)',
      'Contrast financial ledger requirements with social media likes',
    ],
    difficulty: 'INTERMEDIATE',
  },
  {
    id: 'iq-tech-02',
    role: 'Full-Stack Software Engineer',
    category: 'TECHNICAL',
    questionText: 'How does the JavaScript event loop handle microtasks (Promises) versus macrotasks (setTimeout)? Give a concrete example.',
    context: 'Assesses JavaScript concurrency model and execution queue priority.',
    sampleAnswerGuidelines: [
      'Explain Call Stack, Web APIs, Microtask Queue, and Task Queue',
      'Clarify that microtasks run immediately after call stack empties before rendering or next macrotask',
    ],
    difficulty: 'INTERMEDIATE',
  },
  {
    id: 'iq-tech-03',
    role: 'Backend Engineer',
    category: 'TECHNICAL',
    questionText: 'What is the Leftmost Prefix Rule in database compound indexing, and what happens if a WHERE query omits the leading column?',
    context: 'Tests database indexing principles and query optimization techniques.',
    sampleAnswerGuidelines: [
      'Compound B-Tree index structure ordered hierarchically by (col1, col2, col3)',
      'Omitting col1 prevents index range scan and forces table or full index scan',
      'Explain compound index design according to query filtering patterns',
    ],
    difficulty: 'ADVANCED',
  },

  // 2. Behavioral
  {
    id: 'iq-beh-01',
    role: 'Software Engineer',
    category: 'BEHAVIORAL',
    questionText: 'Describe a challenging technical bug or blocker you encountered in a team project and how you systematically diagnosed and resolved it.',
    context: 'Evaluates analytical reasoning, debugging methodology, and communication using the STAR framework.',
    sampleAnswerGuidelines: [
      'Situation: Context of the project and deadline',
      'Task: Specific technical defect identified',
      'Action: Systematic debugging steps taken (logs, isolation, hypothesis testing)',
      'Result: Bug resolution, test coverage added, and team outcome',
    ],
    difficulty: 'BEGINNER',
  },
  {
    id: 'iq-beh-02',
    role: 'Software Engineer',
    category: 'BEHAVIORAL',
    questionText: 'Tell me about a time when you and a teammate disagreed on an architectural approach or coding choice. How did you resolve the difference?',
    context: 'Tests collaboration, empathy, objective data-driven decision making, and professionalism.',
    sampleAnswerGuidelines: [
      'Describe the differing technical viewpoints objectively',
      'Explain how data, benchmarks, or prototypes were used to decide',
      'Emphasize alignment behind the team decision and mutual respect',
    ],
    difficulty: 'INTERMEDIATE',
  },

  // 3. HR / Culture
  {
    id: 'iq-hr-01',
    role: 'Software Engineer',
    category: 'HR',
    questionText: 'Coming from a college without an established placement cell, what proactive steps did you take to master modern engineering standards?',
    context: 'Evaluates self-drive, resourcefulness, initiative, and continuous learning ethos.',
    sampleAnswerGuidelines: [
      'Highlight open-source projects built and deployed independently',
      'Mention verified skills earned via standardized objective assessments',
      'Express genuine passion for continuous engineering growth',
    ],
    difficulty: 'BEGINNER',
  },
  {
    id: 'iq-hr-02',
    role: 'Software Engineer',
    category: 'HR',
    questionText: 'Where do you see your engineering journey evolving over the next 2-3 years, and what domain or technologies are you most eager to deepen?',
    context: 'Assesses career intentionality, growth mindset, and technical curiosity.',
    sampleAnswerGuidelines: [
      'Articulate goals of shipping reliable production code and mastering cloud/system architecture',
      'Demonstrate commitment to mentorship and team contribution',
    ],
    difficulty: 'BEGINNER',
  },
];

export class InterviewPrepService {
  /**
   * Returns curated practice questions filtered by role or category.
   */
  public static getPracticeQuestions(
    role?: string,
    category?: InterviewTypeCategory
  ): InterviewPracticeQuestion[] {
    let questions = CURATED_INTERVIEW_QUESTIONS;

    if (category) {
      questions = questions.filter((q) => q.category === category);
    }
    if (role && role.trim()) {
      const lower = role.toLowerCase();
      const filtered = questions.filter(
        (q) => q.role.toLowerCase().includes(lower) || lower.includes(q.role.toLowerCase())
      );
      if (filtered.length > 0) return filtered;
    }

    return questions;
  }

  /**
   * Evaluates student's written response to an interview question.
   */
  public static async evaluateAnswer(
    userId: string,
    questionId: string,
    studentAnswer: string
  ): Promise<InterviewFeedbackReport> {
    const aiService = AiService.getInstance();
    const cleanAnswer = studentAnswer.trim();

    const question =
      CURATED_INTERVIEW_QUESTIONS.find((q) => q.id === questionId) ||
      CURATED_INTERVIEW_QUESTIONS[0];

    const wordCount = cleanAnswer.split(/\s+/).filter(Boolean).length;
    let score = 70;
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];

    if (wordCount >= 50) {
      score += 15;
      strengths.push('Comprehensive answer providing sufficient depth and context.');
    } else if (wordCount >= 20) {
      score += 5;
      strengths.push('Concise initial thought stated.');
      areasForImprovement.push('Elaborate with concrete technical examples or measurable outcomes.');
    } else {
      score -= 20;
      areasForImprovement.push('Answer is too brief. Expand on technical specifics, tradeoffs, and methodology.');
    }

    // Category-specific checks
    if (question.category === 'BEHAVIORAL') {
      const lower = cleanAnswer.toLowerCase();
      const hasStar =
        (lower.includes('situation') || lower.includes('project')) &&
        (lower.includes('action') || lower.includes('decided') || lower.includes('implemented')) &&
        (lower.includes('result') || lower.includes('outcome') || lower.includes('learned'));

      if (hasStar) {
        score += 10;
        strengths.push('Effectively structured using principles of the STAR method.');
      } else {
        areasForImprovement.push('Structure your narrative using STAR: Situation $\\rightarrow$ Task $\\rightarrow$ Action $\\rightarrow$ Result.');
      }
    } else if (question.category === 'TECHNICAL') {
      const hasTechTerms =
        cleanAnswer.includes('transact') ||
        cleanAnswer.includes('index') ||
        cleanAnswer.includes('promise') ||
        cleanAnswer.includes('queue') ||
        cleanAnswer.includes('acid') ||
        cleanAnswer.includes('event');

      if (hasTechTerms) {
        score += 10;
        strengths.push('Accurate technical vocabulary and domain terminology applied.');
      } else {
        areasForImprovement.push('Incorporate core domain concepts and concrete architecture terms.');
      }
    }

    score = Math.min(100, Math.max(30, score));

    return {
      questionId: question.id,
      questionText: question.questionText,
      studentAnswer: cleanAnswer,
      score,
      strengths,
      areasForImprovement,
      modelAnswerSnippet:
        question.sampleAnswerGuidelines?.join(' • ') ||
        'A comprehensive answer articulates clear context, technical constraints, concrete engineering actions, and measurable business or system outcomes.',
      isFallback: !aiService.isRealProviderConnected(),
      provider: aiService.getActiveProviderName(),
      disclaimer:
        'AI interview feedback is advisory and evaluated strictly against written technical criteria. CareerBridge does not evaluate tone, video, or physical expressions.',
      evaluatedAt: new Date().toISOString(),
    };
  }
}
