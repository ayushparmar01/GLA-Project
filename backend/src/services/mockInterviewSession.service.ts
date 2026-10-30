import mongoose from 'mongoose';
import {
  MockInterviewSession,
  IMockInterviewSession,
} from '../models/mockInterviewSession.model.js';
import {
  MockInterviewSessionConfig,
  MockInterviewSessionData,
  MockInterviewAnswerData,
} from '../types/index.js';
import { InterviewQuestionBankService } from './interviewQuestionBank.service.js';
import { InterviewEvaluationService } from './interviewEvaluation.service.js';
import { Notification } from '../models/notification.model.js';
import { getDbStatus } from '../config/db.js';

export class MockInterviewSessionService {
  /**
   * Creates a new mock interview session with tailored questions.
   */
  public static async createSession(
    studentId: string,
    config: MockInterviewSessionConfig
  ): Promise<MockInterviewSessionData> {
    // 1. Validate inputs
    const durationMinutes = Math.min(60, Math.max(5, Number(config.durationMinutes) || 20));
    const questionCount = Math.min(15, Math.max(1, Number(config.questionCount) || 5));
    const targetRole = (config.targetRole || 'Software Engineer').trim();
    const difficulty = config.difficulty || 'INTERMEDIATE';
    const language = config.language || 'en';
    const interviewType = config.interviewType || 'TECHNICAL';

    // 2. Fetch or generate questions
    const questions = await InterviewQuestionBankService.getQuestionsForSession({
      interviewType,
      targetRole,
      difficulty,
      questionCount,
      jobId: config.jobId,
      resumeId: config.resumeId,
      studentId,
    });

    const dbStatus = getDbStatus();
    if (dbStatus.status === 'connected') {
      try {
        const session = new MockInterviewSession({
          studentId: new mongoose.Types.ObjectId(studentId),
          interviewType,
          targetRole,
          difficulty,
          language,
          durationMinutes,
          questionCount: questions.length,
          jobId: config.jobId ? new mongoose.Types.ObjectId(config.jobId) : undefined,
          resumeId: config.resumeId ? new mongoose.Types.ObjectId(config.resumeId) : undefined,
          status: 'CREATED',
          questions,
          answers: [],
        });

        await session.save();
        return session.toSafeObject();
      } catch (err) {
        // Fallback for transient errors
      }
    }

    // In-memory fallback
    return {
      id: `session-mock-${Date.now()}`,
      studentId,
      interviewType,
      targetRole,
      difficulty,
      language,
      durationMinutes,
      questionCount: questions.length,
      jobId: config.jobId,
      resumeId: config.resumeId,
      status: 'CREATED',
      questions,
      answers: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Starts a mock interview session, triggering the countdown timer.
   */
  public static async startSession(
    sessionId: string,
    studentId: string
  ): Promise<MockInterviewSessionData> {
    const dbStatus = getDbStatus();
    if (dbStatus.status === 'connected') {
      const session = await MockInterviewSession.findOne({ _id: sessionId, studentId });
      if (!session) {
        throw new Error('Interview session not found or unauthorized access.');
      }

      if (session.status === 'COMPLETED' || session.status === 'SUBMITTED') {
        throw new Error('Cannot start a session that has already been submitted or completed.');
      }

      session.status = 'IN_PROGRESS';
      if (!session.startedAt) {
        session.startedAt = new Date();
      }
      await session.save();
      return session.toSafeObject();
    }

    throw new Error('Database connection required to start interview session.');
  }

  /**
   * Saves or updates an answer for a specific question within the active session.
   */
  public static async saveAnswer(
    sessionId: string,
    studentId: string,
    answerData: {
      questionId: string;
      answerText: string;
      answerType?: 'TEXT' | 'CODE';
      codeLanguage?: string;
      timeSpentSeconds?: number;
    }
  ): Promise<MockInterviewSessionData> {
    const dbStatus = getDbStatus();
    if (dbStatus.status !== 'connected') {
      throw new Error('Database connection required to save answer.');
    }

    const session = await MockInterviewSession.findOne({ _id: sessionId, studentId });
    if (!session) {
      throw new Error('Interview session not found or unauthorized access.');
    }

    if (session.status === 'COMPLETED' || session.status === 'SUBMITTED') {
      throw new Error('Cannot modify answers in a submitted interview session.');
    }

    const existingIdx = session.answers.findIndex((a) => a.questionId === answerData.questionId);
    const newAnswer: MockInterviewAnswerData = {
      questionId: answerData.questionId,
      answerText: answerData.answerText.trim(),
      answerType: answerData.answerType || 'TEXT',
      codeLanguage: answerData.codeLanguage,
      timeSpentSeconds: answerData.timeSpentSeconds || 0,
      submittedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      session.answers[existingIdx] = newAnswer;
    } else {
      session.answers.push(newAnswer);
    }

    session.status = 'IN_PROGRESS';
    await session.save();
    return session.toSafeObject();
  }

  /**
   * Submits the interview session and executes the AI evaluation engine.
   */
  public static async submitSession(
    sessionId: string,
    studentId: string
  ): Promise<MockInterviewSessionData> {
    const dbStatus = getDbStatus();
    if (dbStatus.status !== 'connected') {
      throw new Error('Database connection required to submit interview session.');
    }

    const session = await MockInterviewSession.findOne({ _id: sessionId, studentId });
    if (!session) {
      throw new Error('Interview session not found or unauthorized access.');
    }

    if (session.status === 'COMPLETED') {
      return session.toSafeObject();
    }

    session.status = 'EVALUATING';
    session.submittedAt = new Date();
    await session.save();

    try {
      // Execute multi-rubric evaluation
      const evaluation = await InterviewEvaluationService.evaluateSession(
        session.questions,
        session.answers
      );

      session.evaluation = evaluation;
      session.status = 'COMPLETED';
      session.completedAt = new Date();
      await session.save();

      // Dispatch non-blocking notification
      try {
        await Notification.create({
          recipientId: session.studentId,
          type: 'APPLICATION_STATUS_CHANGED', // reuse standard notification type
          title: 'Mock Interview Feedback Ready',
          message: `Your ${session.interviewType} mock interview for ${session.targetRole} has been evaluated. Score: ${evaluation.overallScore}/100.`,
          relatedEntityType: 'INTERVIEW',
          relatedEntityId: (session._id as any).toString(),
        });
      } catch {
        // Non-blocking notification failure
      }

      return session.toSafeObject();
    } catch (err: any) {
      session.status = 'FAILED';
      await session.save();
      throw new Error(`Interview evaluation failed: ${err.message}`);
    }
  }

  /**
   * Retrieves single interview session by ID ensuring student data isolation.
   */
  public static async getSessionById(
    sessionId: string,
    studentId: string
  ): Promise<MockInterviewSessionData> {
    const dbStatus = getDbStatus();
    if (dbStatus.status !== 'connected') {
      throw new Error('Database connection required to retrieve interview session.');
    }

    const session = await MockInterviewSession.findOne({ _id: sessionId, studentId });
    if (!session) {
      throw new Error('Interview session not found or access denied.');
    }

    return session.toSafeObject();
  }

  /**
   * Lists interview sessions for the authenticated student with filtering and pagination.
   */
  public static async listStudentSessions(
    studentId: string,
    filters: {
      interviewType?: string;
      status?: string;
      difficulty?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ sessions: MockInterviewSessionData[]; total: number }> {
    const dbStatus = getDbStatus();
    if (dbStatus.status !== 'connected') {
      return { sessions: [], total: 0 };
    }

    const query: Record<string, any> = {
      studentId: new mongoose.Types.ObjectId(studentId),
    };

    if (filters.interviewType && filters.interviewType !== 'ALL') {
      query.interviewType = filters.interviewType;
    }
    if (filters.status && filters.status !== 'ALL') {
      query.status = filters.status;
    }
    if (filters.difficulty && filters.difficulty !== 'ALL') {
      query.difficulty = filters.difficulty;
    }

    const limit = Math.min(50, Math.max(1, filters.limit || 20));
    const offset = Math.max(0, filters.offset || 0);

    const [sessions, total] = await Promise.all([
      MockInterviewSession.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit),
      MockInterviewSession.countDocuments(query),
    ]);

    return {
      sessions: sessions.map((s) => s.toSafeObject()),
      total,
    };
  }
}
