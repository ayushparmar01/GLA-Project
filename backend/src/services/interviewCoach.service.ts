import {
  InterviewCoachQuery,
  InterviewCoachResponse,
  MockInterviewQuestionData,
} from '../types/index.js';
import { AiService } from './ai/ai.service.js';
import { MockInterviewSession } from '../models/mockInterviewSession.model.js';

export class InterviewCoachService {
  /**
   * Provides real-time guidance, conceptual hints, or structure suggestions from the AI Coach.
   */
  public static async consultCoach(
    query: InterviewCoachQuery,
    studentId: string
  ): Promise<InterviewCoachResponse> {
    const aiService = AiService.getInstance();

    // 1. Fetch Session to retrieve question and mode
    const session = await MockInterviewSession.findOne({
      _id: query.sessionId,
      studentId,
    });

    if (!session) {
      throw new Error('Interview session not found or access denied.');
    }

    const question = session.questions.find((q) => q.id === query.questionId);
    if (!question) {
      throw new Error('Question not found in the current session.');
    }

    // 2. Strict Mock Interview Mode Protection
    if (query.mode === 'MOCK') {
      return {
        response:
          'In Mock Interview Mode, the AI Coach operates under real interview conditions and does not provide hints or reveal expected answers before submission. Trust your preparation and do your best!',
        disclaimer: 'Mock Interview Mode simulates real testing conditions without coaching prompts.',
      };
    }

    // 3. Practice Mode Assistance
    const cleanInput = query.studentInput ? aiService.sanitizePrompt(query.studentInput) : '';

    let coachResponse = '';
    const suggestedTopics: string[] = [question.topic];

    switch (query.queryType) {
      case 'HINT':
        coachResponse = this.generateHint(question);
        break;

      case 'CONCEPT_EXPLANATION':
        coachResponse = this.generateConceptExplanation(question);
        break;

      case 'STRUCTURE_ADVICE':
        coachResponse = this.generateStructureAdvice(question);
        break;

      case 'FOLLOWUP_QUESTION':
        coachResponse = this.generateFollowupQuestion(question);
        break;

      default:
        coachResponse = `Focus on addressing the key concept of ${question.topic}. Break your thought process into clear steps.`;
    }

    // Attempt AI enhancement if connected
    if (aiService.isRealProviderConnected()) {
      try {
        const prompt = `As an encouraging Career Coach, provide a brief 2-sentence coaching response for a student asking for "${query.queryType}" on this interview question: "${question.questionText}". Focus topic: ${question.topic}. Do not give away the complete solution.`;
        const res = await aiService.generateText({
          prompt,
          purpose: 'INTERVIEW_COACH_ASSISTANCE',
          maxTokens: 120,
          temperature: 0.3,
        });
        if (res && res.text && res.text.trim().length > 15) {
          coachResponse = res.text.trim();
        }
      } catch {
        // Fallback to deterministic template
      }
    }

    return {
      response: coachResponse,
      suggestedTopics,
      disclaimer: 'Advisory guidance for practice preparation. Strive to formulate answers in your own authentic voice.',
    };
  }

  private static generateHint(q: MockInterviewQuestionData): string {
    if (q.questionType === 'CODING') {
      return `Hint: Consider what data structure allows O(1) lookups or how sorting the inputs might simplify searching. Watch out for edge cases like empty arrays or duplicates.`;
    }
    if (q.category === 'BEHAVIORAL') {
      return `Hint: Think of a specific project where you faced a concrete challenge. Focus on what YOU personally decided and did, rather than general team activities.`;
    }
    return `Hint: Identify the core trade-offs involved in ${q.topic} (e.g. read performance vs write overhead, or memory footprint vs execution speed).`;
  }

  private static generateConceptExplanation(q: MockInterviewQuestionData): string {
    const concepts = q.expectedConcepts && q.expectedConcepts.length > 0
      ? q.expectedConcepts.join(', ')
      : q.topic;
    return `The interviewer is testing your mastery of: ${concepts}. A strong answer defines these fundamentals clearly before applying them to practical examples.`;
  }

  private static generateStructureAdvice(q: MockInterviewQuestionData): string {
    if (q.category === 'BEHAVIORAL') {
      return `Recommended Structure: 1) Situation (set the stage briefly), 2) Task (what was your objective?), 3) Action (what specific steps did you take?), 4) Result (what was the outcome and learning?).`;
    }
    if (q.questionType === 'CODING') {
      return `Recommended Structure: 1) Clarify constraints and edge cases, 2) Explain brute force and its time/space complexity, 3) Propose the optimal approach, 4) Write clean modular code, 5) Trace through a test case.`;
    }
    return `Recommended Structure: 1) Direct answer / definition, 2) Technical mechanism / how it works under the hood, 3) Real-world use case or trade-off comparison.`;
  }

  private static generateFollowupQuestion(q: MockInterviewQuestionData): string {
    return `Common follow-up question: "How would your solution scale if the data volume grew by 100x, or how would you handle unexpected concurrent requests?"`;
  }
}
