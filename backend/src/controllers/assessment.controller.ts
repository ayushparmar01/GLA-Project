import { Request, Response } from 'express';
import { Assessment, IAssessment } from '../models/assessment.model.js';
import { AssessmentAttempt } from '../models/assessmentAttempt.model.js';
import { AssessmentEvaluationService } from '../services/assessmentEvaluation.service.js';
import { SEED_ASSESSMENTS, SeedAssessment } from '../config/skillTaxonomy.seed.js';
import { getDbStatus } from '../config/db.js';
import { ApiResponse, AssessmentData, AssessmentAttemptData } from '../types/index.js';

// Helper to convert SeedAssessment to sanitized AssessmentData
function seedToSafeAssessment(s: SeedAssessment): AssessmentData {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    category: s.category,
    skillsTested: s.skillsTested,
    difficulty: s.difficulty,
    durationMinutes: s.durationMinutes,
    totalMarks: s.questions.reduce((sum, q) => sum + q.marks, 0),
    passingPercentage: s.passingPercentage,
    questionCount: s.questions.length,
    questions: s.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      codeSnippet: q.codeSnippet,
      options: q.options,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      skill: q.skill,
    })),
    isActive: s.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// In-memory attempts store for when DB is offline during tests or development
const inMemoryAttempts = new Map<string, AssessmentAttemptData>();

export class AssessmentController {
  /**
   * GET /api/assessments
   * Lists available skill assessments with answer keys stripped.
   */
  public static async listAssessments(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const difficulty = req.query.difficulty as string | undefined;
      const search = (req.query.search as string | undefined)?.toLowerCase().trim();

      const dbStatus = getDbStatus();
      let assessments: AssessmentData[] = [];

      if (dbStatus.status === 'connected') {
        const filter: Record<string, unknown> = { isActive: true };
        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;
        if (search) {
          filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { skillsTested: { $regex: search, $options: 'i' } },
          ];
        }

        const dbAssessments = await Assessment.find(filter).sort({ createdAt: -1 });
        if (dbAssessments.length > 0) {
          assessments = dbAssessments.map((a) => a.toSafeObject());
        }
      }

      if (assessments.length === 0) {
        assessments = SEED_ASSESSMENTS.filter((s) => {
          if (!s.isActive) return false;
          if (category && s.category !== category) return false;
          if (difficulty && s.difficulty !== difficulty) return false;
          if (search) {
            const matchesTitle = s.title.toLowerCase().includes(search);
            const matchesDesc = s.description.toLowerCase().includes(search);
            const matchesSkills = s.skillsTested.some((st) => st.toLowerCase().includes(search));
            return matchesTitle || matchesDesc || matchesSkills;
          }
          return true;
        }).map(seedToSafeAssessment);
      }

      const response: ApiResponse<AssessmentData[]> = {
        success: true,
        data: assessments,
      };
      res.status(200).json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_ASSESSMENTS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to list assessments',
        },
      });
    }
  }

  /**
   * GET /api/assessments/:assessmentId
   * Retrieves single assessment instructions and sanitized question set.
   */
  public static async getAssessmentById(req: Request, res: Response): Promise<void> {
    try {
      const assessmentId = String(req.params.assessmentId);
      const dbStatus = getDbStatus();
      let assessmentData: AssessmentData | null = null;

      if (dbStatus.status === 'connected') {
        const doc = await Assessment.findOne({
          $or: [{ assessmentId }, { _id: assessmentId.match(/^[0-9a-fA-F]{24}$/) ? assessmentId : undefined }],
        });
        if (doc) {
          assessmentData = doc.toSafeObject();
        }
      }

      if (!assessmentData) {
        const seed = SEED_ASSESSMENTS.find((s) => s.id === assessmentId);
        if (seed) {
          assessmentData = seedToSafeAssessment(seed);
        }
      }

      if (!assessmentData) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ASSESSMENT_NOT_FOUND',
            message: `Assessment with ID '${assessmentId}' was not found.`,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: assessmentData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_ASSESSMENT_ERROR',
          message: error instanceof Error ? error.message : 'Error fetching assessment',
        },
      });
    }
  }

  /**
   * POST /api/assessments/:assessmentId/attempts
   * Starts a new attempt or resumes an active in-progress attempt.
   */
  public static async startAttempt(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      const assessmentId = String(req.params.assessmentId);
      const dbStatus = getDbStatus();

      // Find assessment definition
      let assessmentDoc: IAssessment | null = null;
      let seedMatch: SeedAssessment | undefined;

      if (dbStatus.status === 'connected') {
        assessmentDoc = await Assessment.findOne({
          $or: [{ assessmentId }, { _id: assessmentId.match(/^[0-9a-fA-F]{24}$/) ? assessmentId : undefined }],
        });
      }

      if (!assessmentDoc) {
        seedMatch = SEED_ASSESSMENTS.find((s) => s.id === assessmentId);
      }

      if (!assessmentDoc && !seedMatch) {
        res.status(404).json({
          success: false,
          error: { code: 'ASSESSMENT_NOT_FOUND', message: 'Assessment not found' },
        });
        return;
      }

      const title = assessmentDoc ? assessmentDoc.title : seedMatch!.title;
      const category = assessmentDoc ? assessmentDoc.category : seedMatch!.category;
      const difficulty = assessmentDoc ? assessmentDoc.difficulty : seedMatch!.difficulty;
      const durationMinutes = assessmentDoc ? assessmentDoc.durationMinutes : seedMatch!.durationMinutes;
      const totalMarks = assessmentDoc
        ? assessmentDoc.totalMarks
        : seedMatch!.questions.reduce((sum, q) => sum + q.marks, 0);

      const sanitizedQuestions = assessmentDoc
        ? assessmentDoc.toSafeObject().questions || []
        : seedToSafeAssessment(seedMatch!).questions || [];

      // Check for active IN_PROGRESS attempt
      if (dbStatus.status === 'connected') {
        const existingAttempt = await AssessmentAttempt.findOne({
          studentId,
          assessmentId,
          status: 'IN_PROGRESS',
        });

        if (existingAttempt) {
          // Check if expired
          const elapsedMs = Date.now() - existingAttempt.startedAt.getTime();
          const maxAllowedMs = (existingAttempt.durationMinutes * 60 * 1000) + (2 * 60 * 1000);
          if (elapsedMs > maxAllowedMs) {
            existingAttempt.status = 'EXPIRED';
            await existingAttempt.save();
          } else {
            res.status(200).json({
              success: true,
              data: existingAttempt.toSafeObject(),
            });
            return;
          }
        }

        // Create new attempt in DB
        const newAttempt = new AssessmentAttempt({
          studentId,
          assessmentId,
          assessmentTitle: title,
          category,
          difficulty,
          status: 'IN_PROGRESS',
          answers: {},
          score: 0,
          totalMarks,
          percentage: 0,
          passed: false,
          startedAt: new Date(),
          durationMinutes,
          sanitizedQuestions,
        });

        await newAttempt.save();
        res.status(201).json({
          success: true,
          data: newAttempt.toSafeObject(),
        });
        return;
      }

      // Offline in-memory fallback
      const inMemoryKey = `${studentId}:${assessmentId}`;
      const existingInMemory = inMemoryAttempts.get(inMemoryKey);
      if (existingInMemory && existingInMemory.status === 'IN_PROGRESS') {
        res.status(200).json({
          success: true,
          data: existingInMemory,
        });
        return;
      }

      const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const attemptData: AssessmentAttemptData = {
        id: attemptId,
        studentId,
        assessmentId,
        assessmentTitle: title,
        category,
        difficulty,
        status: 'IN_PROGRESS',
        answers: {},
        score: 0,
        totalMarks,
        percentage: 0,
        passed: false,
        startedAt: new Date().toISOString(),
        durationMinutes,
        sanitizedQuestions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryAttempts.set(inMemoryKey, attemptData);
      inMemoryAttempts.set(attemptId, attemptData);

      res.status(201).json({
        success: true,
        data: attemptData,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'START_ATTEMPT_FAILED',
          message: error instanceof Error ? error.message : 'Could not start assessment attempt',
        },
      });
    }
  }

  /**
   * PATCH /api/assessments/:assessmentId/attempts/:attemptId/answers
   * Autosaves student answers incrementally during test taking.
   */
  public static async saveAnswers(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      const attemptId = String(req.params.attemptId);
      const answers = req.body.answers as Record<string, string[]> | undefined;

      if (!answers || typeof answers !== 'object') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_ANSWERS', message: 'Answers payload must be an object map' },
        });
        return;
      }

      const dbStatus = getDbStatus();

      if (dbStatus.status === 'connected') {
        const attempt = await AssessmentAttempt.findById(attemptId);
        if (!attempt) {
          res.status(404).json({
            success: false,
            error: { code: 'ATTEMPT_NOT_FOUND', message: 'Attempt not found' },
          });
          return;
        }

        if (attempt.studentId.toString() !== studentId) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You do not own this attempt' },
          });
          return;
        }

        if (attempt.status !== 'IN_PROGRESS') {
          res.status(400).json({
            success: false,
            error: { code: 'ATTEMPT_CLOSED', message: `Cannot save answers on an attempt with status '${attempt.status}'` },
          });
          return;
        }

        // Expiration check
        const elapsedMs = Date.now() - attempt.startedAt.getTime();
        const maxAllowedMs = (attempt.durationMinutes * 60 * 1000) + (2 * 60 * 1000);
        if (elapsedMs > maxAllowedMs) {
          attempt.status = 'EXPIRED';
          await attempt.save();
          res.status(400).json({
            success: false,
            error: { code: 'ATTEMPT_EXPIRED', message: 'Assessment time limit has expired' },
          });
          return;
        }

        attempt.answers = new Map(Object.entries(answers));
        await attempt.save();

        res.status(200).json({
          success: true,
          data: attempt.toSafeObject(),
        });
        return;
      }

      // Offline in-memory fallback
      const inMem = inMemoryAttempts.get(attemptId);
      if (!inMem) {
        res.status(404).json({
          success: false,
          error: { code: 'ATTEMPT_NOT_FOUND', message: 'Attempt not found' },
        });
        return;
      }

      if (inMem.studentId !== studentId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not own this attempt' },
        });
        return;
      }

      if (inMem.status !== 'IN_PROGRESS') {
        res.status(400).json({
          success: false,
          error: { code: 'ATTEMPT_CLOSED', message: `Attempt is already ${inMem.status}` },
        });
        return;
      }

      inMem.answers = answers;
      inMem.updatedAt = new Date().toISOString();

      res.status(200).json({
        success: true,
        data: inMem,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SAVE_ANSWERS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to save answers',
        },
      });
    }
  }

  /**
   * POST /api/assessments/:assessmentId/attempts/:attemptId/submit
   * Submits answers for server-side evaluation and returns detailed result review.
   */
  public static async submitAttempt(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      const assessmentId = String(req.params.assessmentId);
      const attemptId = String(req.params.attemptId);
      const submittedAnswers = (req.body.answers as Record<string, string[]>) || {};

      const dbStatus = getDbStatus();

      // Find assessment definition for scoring
      let assessmentDoc: IAssessment | null = null;
      let seedMatch: SeedAssessment | undefined;

      if (dbStatus.status === 'connected') {
        assessmentDoc = await Assessment.findOne({
          $or: [{ assessmentId }, { _id: assessmentId.match(/^[0-9a-fA-F]{24}$/) ? assessmentId : undefined }],
        });
      }

      if (!assessmentDoc) {
        seedMatch = SEED_ASSESSMENTS.find((s) => s.id === assessmentId);
      }

      if (!assessmentDoc && !seedMatch) {
        res.status(404).json({
          success: false,
          error: { code: 'ASSESSMENT_NOT_FOUND', message: 'Assessment definition not found' },
        });
        return;
      }

      // Convert seed to fake assessment doc if needed
      const assessmentForGrading: IAssessment = assessmentDoc || ({
        assessmentId: seedMatch!.id,
        title: seedMatch!.title,
        description: seedMatch!.description,
        category: seedMatch!.category,
        skillsTested: seedMatch!.skillsTested,
        difficulty: seedMatch!.difficulty,
        durationMinutes: seedMatch!.durationMinutes,
        totalMarks: seedMatch!.questions.reduce((sum, q) => sum + q.marks, 0),
        passingPercentage: seedMatch!.passingPercentage,
        isActive: seedMatch!.isActive,
        questions: seedMatch!.questions.map((q) => ({
          questionId: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          codeSnippet: q.codeSnippet,
          options: q.options,
          correctAnswers: q.correctAnswers,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          explanation: q.explanation,
          skill: q.skill,
        })),
      } as unknown as IAssessment);

      if (dbStatus.status === 'connected') {
        const attempt = await AssessmentAttempt.findById(attemptId);
        if (!attempt) {
          res.status(404).json({
            success: false,
            error: { code: 'ATTEMPT_NOT_FOUND', message: 'Attempt not found' },
          });
          return;
        }

        if (attempt.studentId.toString() !== studentId) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'You do not own this attempt' },
          });
          return;
        }

        if (attempt.status === 'SUBMITTED') {
          res.status(400).json({
            success: false,
            error: { code: 'ATTEMPT_ALREADY_SUBMITTED', message: 'This attempt has already been submitted and scored' },
          });
          return;
        }

        // Merge answers if provided
        const answersRecord: Record<string, string[]> = {};
        if (attempt.answers) {
          for (const [key, val] of attempt.answers.entries()) {
            answersRecord[key] = val;
          }
        }
        Object.assign(answersRecord, submittedAnswers);

        // Grade attempt
        const evalResult = AssessmentEvaluationService.evaluate(
          assessmentForGrading,
          answersRecord,
          attempt.startedAt
        );

        const now = new Date();
        const timeTakenSeconds = Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000);

        attempt.status = evalResult.isExpired ? 'EXPIRED' : 'SUBMITTED';
        attempt.answers = new Map(Object.entries(answersRecord));
        attempt.score = evalResult.score;
        attempt.totalMarks = evalResult.totalMarks;
        attempt.percentage = evalResult.percentage;
        attempt.passed = evalResult.passed;
        attempt.submittedAt = now;
        attempt.timeTakenSeconds = timeTakenSeconds;
        attempt.skillWiseResults = evalResult.skillWiseResults;
        attempt.questionEvaluations = evalResult.questionEvaluations;

        await attempt.save();

        res.status(200).json({
          success: true,
          data: attempt.toSafeObject(),
        });
        return;
      }

      // Offline in-memory evaluation
      const inMem = inMemoryAttempts.get(attemptId);
      if (!inMem) {
        res.status(404).json({
          success: false,
          error: { code: 'ATTEMPT_NOT_FOUND', message: 'Attempt not found' },
        });
        return;
      }

      if (inMem.studentId !== studentId) {
        res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'You do not own this attempt' },
        });
        return;
      }

      if (inMem.status === 'SUBMITTED') {
        res.status(400).json({
          success: false,
          error: { code: 'ATTEMPT_ALREADY_SUBMITTED', message: 'This attempt has already been submitted and scored' },
        });
        return;
      }

      const finalAnswers = { ...inMem.answers, ...submittedAnswers };
      const evalResult = AssessmentEvaluationService.evaluate(
        assessmentForGrading,
        finalAnswers,
        new Date(inMem.startedAt)
      );

      const now = new Date();
      const timeTakenSeconds = Math.round((now.getTime() - new Date(inMem.startedAt).getTime()) / 1000);

      inMem.status = evalResult.isExpired ? 'EXPIRED' : 'SUBMITTED';
      inMem.answers = finalAnswers;
      inMem.score = evalResult.score;
      inMem.totalMarks = evalResult.totalMarks;
      inMem.percentage = evalResult.percentage;
      inMem.passed = evalResult.passed;
      inMem.submittedAt = now.toISOString();
      inMem.timeTakenSeconds = timeTakenSeconds;
      inMem.skillWiseResults = evalResult.skillWiseResults;
      inMem.questionEvaluations = evalResult.questionEvaluations;
      inMem.updatedAt = now.toISOString();

      res.status(200).json({
        success: true,
        data: inMem,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SUBMISSION_FAILED',
          message: error instanceof Error ? error.message : 'Error evaluating assessment attempt',
        },
      });
    }
  }

  /**
   * GET /api/assessments/my-history
   * Returns student's assessment attempt history.
   */
  public static async getMyAssessmentHistory(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.sub;
      if (!studentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
        return;
      }

      const dbStatus = getDbStatus();
      let attempts: AssessmentAttemptData[] = [];

      if (dbStatus.status === 'connected') {
        const dbAttempts = await AssessmentAttempt.find({ studentId }).sort({ createdAt: -1 });
        attempts = dbAttempts.map((a) => a.toSafeObject());
      } else {
        attempts = Array.from(inMemoryAttempts.values())
          .filter((a) => a.studentId === studentId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      res.status(200).json({
        success: true,
        data: attempts,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_HISTORY_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch assessment history',
        },
      });
    }
  }
}
