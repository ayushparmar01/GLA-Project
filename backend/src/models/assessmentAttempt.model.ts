import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  AssessmentAttemptData,
  AssessmentAttemptStatus,
  SkillCategory,
  SkillDifficulty,
  SkillWiseResult,
  QuestionEvaluation,
  AssessmentQuestion,
} from '../types/index.js';

export interface IAssessmentAttempt extends Document {
  studentId: mongoose.Types.ObjectId;
  assessmentId: string;
  assessmentTitle: string;
  category: SkillCategory;
  difficulty: SkillDifficulty;
  status: AssessmentAttemptStatus;
  answers: Map<string, string[]>;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  startedAt: Date;
  submittedAt?: Date;
  timeTakenSeconds?: number;
  durationMinutes: number;
  skillWiseResults?: SkillWiseResult[];
  questionEvaluations?: QuestionEvaluation[];
  sanitizedQuestions?: AssessmentQuestion[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): AssessmentAttemptData;
}

const SkillWiseResultSchema = new Schema(
  {
    skill: { type: String, required: true },
    totalQuestions: { type: Number, required: true },
    correctQuestions: { type: Number, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
  },
  { _id: false }
);

const QuestionEvaluationSchema = new Schema(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    questionType: { type: String, required: true },
    codeSnippet: { type: String },
    options: {
      type: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true },
        },
      ],
      default: [],
    },
    selectedAnswers: { type: [String], default: [] },
    correctAnswers: { type: [String], default: [] },
    isCorrect: { type: Boolean, required: true },
    marksAwarded: { type: Number, required: true },
    explanation: { type: String },
    skill: { type: String },
  },
  { _id: false }
);

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    assessmentId: {
      type: String,
      required: [true, 'Assessment ID is required'],
      index: true,
    },
    assessmentTitle: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED', 'EXPIRED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    answers: {
      type: Map,
      of: [String],
      default: {},
    },
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    submittedAt: {
      type: Date,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    skillWiseResults: {
      type: [SkillWiseResultSchema],
      default: [],
    },
    questionEvaluations: {
      type: [QuestionEvaluationSchema],
      default: [],
    },
    sanitizedQuestions: {
      type: [Schema.Types.Mixed],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

AssessmentAttemptSchema.index({ studentId: 1, assessmentId: 1, status: 1 });
AssessmentAttemptSchema.index({ studentId: 1, createdAt: -1 });

AssessmentAttemptSchema.methods.toSafeObject = function (this: IAssessmentAttempt): AssessmentAttemptData {
  // Convert answers Map to plain object
  const answersRecord: Record<string, string[]> = {};
  if (this.answers) {
    if (this.answers instanceof Map) {
      for (const [key, value] of this.answers.entries()) {
        answersRecord[key] = value;
      }
    } else {
      Object.assign(answersRecord, this.answers);
    }
  }

  return {
    id: (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId.toString(),
    assessmentId: this.assessmentId,
    assessmentTitle: this.assessmentTitle,
    category: this.category,
    difficulty: this.difficulty,
    status: this.status,
    answers: answersRecord,
    score: this.score,
    totalMarks: this.totalMarks,
    percentage: this.percentage,
    passed: this.passed,
    startedAt: this.startedAt ? this.startedAt.toISOString() : new Date().toISOString(),
    submittedAt: this.submittedAt ? this.submittedAt.toISOString() : undefined,
    timeTakenSeconds: this.timeTakenSeconds,
    durationMinutes: this.durationMinutes,
    skillWiseResults: this.skillWiseResults || [],
    questionEvaluations: this.questionEvaluations || [],
    sanitizedQuestions: this.sanitizedQuestions || [],
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const AssessmentAttempt: Model<IAssessmentAttempt> =
  mongoose.models.AssessmentAttempt ||
  mongoose.model<IAssessmentAttempt>('AssessmentAttempt', AssessmentAttemptSchema);
