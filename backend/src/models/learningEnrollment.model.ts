import mongoose, { Schema, Document, Model } from 'mongoose';
import { LearningEnrollmentData, LearningEnrollmentStatus } from '../types/index.js';

export interface ILearningEnrollment extends Document {
  enrollmentId: string;
  studentId: string;
  learningPathId: string;
  status: LearningEnrollmentStatus;
  progressPercentage: number;
  completedModulesCount: number;
  totalModulesCount: number;
  enrolledAt: Date;
  lastAccessedAt: Date;
  completedAt?: Date;
  streakDays: number;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): LearningEnrollmentData;
}

const LearningEnrollmentSchema = new Schema<ILearningEnrollment>(
  {
    enrollmentId: {
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
    learningPathId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedModulesCount: {
      type: Number,
      default: 0,
    },
    totalModulesCount: {
      type: Number,
      default: 0,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    streakDays: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

LearningEnrollmentSchema.index(
  { studentId: 1, learningPathId: 1 },
  { unique: true }
);

LearningEnrollmentSchema.index({ studentId: 1, status: 1 });

LearningEnrollmentSchema.methods.toSafeObject = function (
  this: ILearningEnrollment
): LearningEnrollmentData {
  return {
    id: this.enrollmentId || (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId,
    learningPathId: this.learningPathId,
    status: this.status,
    progressPercentage: this.progressPercentage || 0,
    completedModulesCount: this.completedModulesCount || 0,
    totalModulesCount: this.totalModulesCount || 0,
    enrolledAt: this.enrolledAt ? this.enrolledAt.toISOString() : new Date().toISOString(),
    lastAccessedAt: this.lastAccessedAt
      ? this.lastAccessedAt.toISOString()
      : new Date().toISOString(),
    completedAt: this.completedAt ? this.completedAt.toISOString() : undefined,
    streakDays: this.streakDays || 1,
  };
};

export const LearningEnrollment: Model<ILearningEnrollment> =
  mongoose.models.LearningEnrollment ||
  mongoose.model<ILearningEnrollment>('LearningEnrollment', LearningEnrollmentSchema);
