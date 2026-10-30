import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  MockInterviewType,
  MockInterviewDifficulty,
  MockInterviewSessionStatus,
  MockInterviewQuestionData,
  MockInterviewAnswerData,
  MockInterviewSessionEvaluation,
  MockInterviewSessionData,
} from '../types/index.js';

export interface IMockInterviewSession extends Document {
  studentId: Types.ObjectId;
  interviewType: MockInterviewType;
  targetRole: string;
  difficulty: MockInterviewDifficulty;
  language: string;
  durationMinutes: number;
  questionCount: number;
  jobId?: Types.ObjectId;
  jobTitle?: string;
  companyName?: string;
  resumeId?: Types.ObjectId;
  status: MockInterviewSessionStatus;
  questions: MockInterviewQuestionData[];
  answers: MockInterviewAnswerData[];
  evaluation?: MockInterviewSessionEvaluation;
  startedAt?: Date;
  submittedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): MockInterviewSessionData;
}

const MockInterviewAnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    answerText: { type: String, required: true, trim: true },
    answerType: { type: String, enum: ['TEXT', 'CODE'], default: 'TEXT' },
    codeLanguage: { type: String, trim: true },
    timeSpentSeconds: { type: Number, default: 0 },
    submittedAt: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const MockInterviewQuestionSnapshotSchema = new Schema(
  {
    id: { type: String, required: true },
    questionText: { type: String, required: true },
    category: { type: String, required: true },
    topic: { type: String, required: true },
    role: { type: String, required: true },
    difficulty: { type: String, required: true },
    questionType: { type: String, required: true },
    expectedConcepts: [{ type: String }],
    suggestedApproach: { type: String },
    starterCode: { type: String },
    codeLanguage: { type: String },
    timeLimitSeconds: { type: Number, default: 300 },
    sourceType: { type: String, default: 'CURATED' },
  },
  { _id: false }
);

const MockInterviewSessionSchema = new Schema<IMockInterviewSession>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    interviewType: {
      type: String,
      required: true,
      enum: ['TECHNICAL', 'HR', 'BEHAVIORAL', 'ROLE_SPECIFIC', 'JOB_SPECIFIC', 'RESUME_BASED'],
      index: true,
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
      default: 'Software Engineer',
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
    },
    language: {
      type: String,
      default: 'en',
    },
    durationMinutes: {
      type: Number,
      default: 20,
      min: 5,
      max: 60,
    },
    questionCount: {
      type: Number,
      default: 5,
      min: 1,
      max: 15,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'PlacementDrive',
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
    },
    status: {
      type: String,
      enum: ['CREATED', 'IN_PROGRESS', 'PAUSED', 'SUBMITTED', 'EVALUATING', 'COMPLETED', 'FAILED'],
      default: 'CREATED',
      index: true,
    },
    questions: [MockInterviewQuestionSnapshotSchema],
    answers: [MockInterviewAnswerSchema],
    evaluation: {
      overallScore: { type: Number },
      categoryScores: { type: Schema.Types.Mixed },
      strengths: [{ type: String }],
      improvementAreas: [{ type: String }],
      questionFeedbacks: [
        {
          questionId: { type: String },
          questionText: { type: String },
          studentAnswer: { type: String },
          score: { type: Number },
          strengths: [{ type: String }],
          areasForImprovement: [{ type: String }],
          missingConcepts: [{ type: String }],
          suggestedApproach: { type: String },
          starEvaluation: {
            situationScore: { type: Number },
            taskScore: { type: Number },
            actionScore: { type: Number },
            resultScore: { type: Number },
          },
          codingEvaluation: {
            correctnessScore: { type: Number },
            complexityExplanation: { type: String },
            codeQualityScore: { type: Number },
          },
        },
      ],
      nextSteps: [{ type: String }],
      isFallback: { type: Boolean, default: true },
      provider: { type: String, default: 'CareerBridge Deterministic Rubric' },
      rubricVersion: { type: String, default: 'v14.0' },
      disclaimer: { type: String },
      evaluatedAt: { type: String },
    },
    startedAt: { type: Date },
    submittedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

MockInterviewSessionSchema.index({ studentId: 1, createdAt: -1 });
MockInterviewSessionSchema.index({ studentId: 1, status: 1 });
MockInterviewSessionSchema.index({ studentId: 1, interviewType: 1 });

MockInterviewSessionSchema.methods.toSafeObject = function (
  this: IMockInterviewSession
): MockInterviewSessionData {
  return {
    id: (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId.toString(),
    interviewType: this.interviewType,
    targetRole: this.targetRole,
    difficulty: this.difficulty,
    language: this.language,
    durationMinutes: this.durationMinutes,
    questionCount: this.questionCount,
    jobId: this.jobId?.toString(),
    jobTitle: this.jobTitle,
    companyName: this.companyName,
    resumeId: this.resumeId?.toString(),
    status: this.status,
    questions: this.questions || [],
    answers: this.answers || [],
    evaluation: this.evaluation,
    startedAt: this.startedAt ? this.startedAt.toISOString() : undefined,
    submittedAt: this.submittedAt ? this.submittedAt.toISOString() : undefined,
    completedAt: this.completedAt ? this.completedAt.toISOString() : undefined,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const MockInterviewSession: Model<IMockInterviewSession> =
  mongoose.model<IMockInterviewSession>('MockInterviewSession', MockInterviewSessionSchema);
