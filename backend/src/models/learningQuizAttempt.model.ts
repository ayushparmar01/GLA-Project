import mongoose, { Schema, Document, Model } from 'mongoose';
import { LearningQuizAttemptData, QuizQuestionEvaluation } from '../types/index.js';

export interface ILearningQuizAttempt extends Document {
  attemptId: string;
  studentId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  passed: boolean;
  answers: Record<string, string>;
  evaluations: QuizQuestionEvaluation[];
  attemptedAt: Date;
  toSafeObject(): LearningQuizAttemptData;
}

const LearningQuizAttemptSchema = new Schema<ILearningQuizAttempt>(
  {
    attemptId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    quizId: {
      type: String,
      required: true,
      index: true,
    },
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    correctCount: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
    answers: {
      type: Map,
      of: String,
      default: {},
    },
    evaluations: [
      {
        questionId: { type: String, required: true },
        questionText: { type: String, required: true },
        selectedOptionId: { type: String, default: '' },
        correctOptionId: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        explanation: { type: String, default: '' },
      },
    ],
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

LearningQuizAttemptSchema.methods.toSafeObject = function (
  this: ILearningQuizAttempt
): LearningQuizAttemptData {
  const ansRecord: Record<string, string> = {};
  if (this.answers instanceof Map) {
    this.answers.forEach((v, k) => {
      ansRecord[k] = v;
    });
  } else if (typeof this.answers === 'object' && this.answers !== null) {
    Object.assign(ansRecord, this.answers);
  }

  return {
    id: this.attemptId || (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId,
    quizId: this.quizId,
    score: this.score,
    totalQuestions: this.totalQuestions,
    correctCount: this.correctCount,
    passed: this.passed,
    answers: ansRecord,
    evaluations: this.evaluations || [],
    attemptedAt: this.attemptedAt
      ? this.attemptedAt.toISOString()
      : new Date().toISOString(),
  };
};

export const LearningQuizAttempt: Model<ILearningQuizAttempt> =
  mongoose.models.LearningQuizAttempt ||
  mongoose.model<ILearningQuizAttempt>('LearningQuizAttempt', LearningQuizAttemptSchema);
