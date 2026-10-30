import mongoose, { Schema, Document, Model } from 'mongoose';
import { LearningModuleData, LearningPathModuleActivity } from '../types/index.js';

export interface ILearningModule extends Document {
  moduleId: string;
  learningPathId: string;
  sequence: number;
  title: string;
  description: string;
  skillsCovered: string[];
  resourceIds: string[];
  practiceActivities: LearningPathModuleActivity[];
  quizId?: string;
  isRequired: boolean;
  estimatedHours: number;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): LearningModuleData;
}

const LearningModuleSchema = new Schema<ILearningModule>(
  {
    moduleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    learningPathId: {
      type: String,
      required: true,
      index: true,
    },
    sequence: {
      type: Number,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    skillsCovered: {
      type: [String],
      default: [],
    },
    resourceIds: {
      type: [String],
      default: [],
    },
    practiceActivities: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        type: {
          type: String,
          enum: ['CODING', 'PROJECT', 'EXERCISE', 'QUIZ'],
          default: 'EXERCISE',
        },
        link: { type: String, default: '' },
      },
    ],
    quizId: {
      type: String,
      default: '',
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    estimatedHours: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

LearningModuleSchema.methods.toSafeObject = function (
  this: ILearningModule
): LearningModuleData {
  return {
    id: this.moduleId || (this._id as string | mongoose.Types.ObjectId).toString(),
    learningPathId: this.learningPathId,
    sequence: this.sequence,
    title: this.title,
    description: this.description,
    skillsCovered: this.skillsCovered || [],
    resourceIds: this.resourceIds || [],
    practiceActivities: this.practiceActivities || [],
    quizId: this.quizId || undefined,
    isRequired: this.isRequired !== undefined ? this.isRequired : true,
    estimatedHours: this.estimatedHours || 5,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const LearningModule: Model<ILearningModule> =
  mongoose.models.LearningModule ||
  mongoose.model<ILearningModule>('LearningModule', LearningModuleSchema);
