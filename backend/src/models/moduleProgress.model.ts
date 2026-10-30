import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  ModuleProgressData,
  ModuleCompletionStatus,
  ModuleCompletionMethod,
} from '../types/index.js';

export interface IModuleProgress extends Document {
  progressId: string;
  studentId: string;
  learningPathId: string;
  moduleId: string;
  status: ModuleCompletionStatus;
  completionMethod: ModuleCompletionMethod;
  completedAt?: Date;
  quizScore?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): ModuleProgressData;
}

const ModuleProgressSchema = new Schema<IModuleProgress>(
  {
    progressId: {
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
    moduleId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
      index: true,
    },
    completionMethod: {
      type: String,
      enum: ['STUDENT_CONFIRMED', 'QUIZ_VERIFIED', 'AUTO'],
      default: 'STUDENT_CONFIRMED',
    },
    completedAt: {
      type: Date,
    },
    quizScore: {
      type: Number,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

ModuleProgressSchema.index(
  { studentId: 1, learningPathId: 1, moduleId: 1 },
  { unique: true }
);

ModuleProgressSchema.methods.toSafeObject = function (
  this: IModuleProgress
): ModuleProgressData {
  return {
    id: this.progressId || (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId,
    learningPathId: this.learningPathId,
    moduleId: this.moduleId,
    status: this.status,
    completionMethod: this.completionMethod,
    completedAt: this.completedAt ? this.completedAt.toISOString() : undefined,
    quizScore: this.quizScore,
    notes: this.notes,
  };
};

export const ModuleProgress: Model<IModuleProgress> =
  mongoose.models.ModuleProgress ||
  mongoose.model<IModuleProgress>('ModuleProgress', ModuleProgressSchema);
