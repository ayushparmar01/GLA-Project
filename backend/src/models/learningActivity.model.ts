import mongoose, { Schema, Document, Model } from 'mongoose';
import { LearningActivityData, LearningActivityType } from '../types/index.js';

export interface ILearningActivity extends Document {
  activityId: string;
  studentId: string;
  resourceId?: string;
  learningPathId?: string;
  moduleId?: string;
  activityType: LearningActivityType;
  metadata?: Record<string, any>;
  createdAt: Date;
  toSafeObject(): LearningActivityData;
}

const LearningActivitySchema = new Schema<ILearningActivity>(
  {
    activityId: {
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
    resourceId: {
      type: String,
      index: true,
    },
    learningPathId: {
      type: String,
      index: true,
    },
    moduleId: {
      type: String,
      index: true,
    },
    activityType: {
      type: String,
      enum: [
        'RESOURCE_OPENED',
        'RESOURCE_STARTED',
        'RESOURCE_COMPLETED',
        'PATH_ENROLLED',
        'MODULE_COMPLETED',
        'QUIZ_ATTEMPTED',
      ],
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

LearningActivitySchema.methods.toSafeObject = function (
  this: ILearningActivity
): LearningActivityData {
  return {
    id: this.activityId || (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId,
    resourceId: this.resourceId,
    learningPathId: this.learningPathId,
    moduleId: this.moduleId,
    activityType: this.activityType,
    metadata: this.metadata || {},
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

export const LearningActivity: Model<ILearningActivity> =
  mongoose.models.LearningActivity ||
  mongoose.model<ILearningActivity>('LearningActivity', LearningActivitySchema);
