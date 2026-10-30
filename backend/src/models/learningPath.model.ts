import mongoose, { Schema, Document, Model } from 'mongoose';
import { LearningPathData } from '../types/index.js';

export interface ILearningPath extends Document {
  pathId: string;
  title: string;
  slug: string;
  description: string;
  careerRole: string;
  targetSkills: string[];
  prerequisites: string[];
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedDuration: string;
  estimatedHours: number;
  moduleCount: number;
  icon: string;
  color: string;
  isPublished: boolean;
  isFeatured: boolean;
  enrollmentCount: number;
  completionCount: number;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): LearningPathData;
}

const LearningPathSchema = new Schema<ILearningPath>(
  {
    pathId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    careerRole: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetSkills: {
      type: [String],
      default: [],
      index: true,
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
      index: true,
    },
    estimatedDuration: {
      type: String,
      default: '8 weeks',
    },
    estimatedHours: {
      type: Number,
      default: 40,
    },
    moduleCount: {
      type: Number,
      default: 0,
    },
    icon: {
      type: String,
      default: 'Layers',
    },
    color: {
      type: String,
      default: 'indigo',
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    completionCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

LearningPathSchema.methods.toSafeObject = function (
  this: ILearningPath
): LearningPathData {
  return {
    id: this.pathId || (this._id as string | mongoose.Types.ObjectId).toString(),
    title: this.title,
    slug: this.slug,
    description: this.description,
    careerRole: this.careerRole,
    targetSkills: this.targetSkills || [],
    prerequisites: this.prerequisites || [],
    difficulty: this.difficulty,
    estimatedDuration: this.estimatedDuration,
    estimatedHours: this.estimatedHours,
    moduleCount: this.moduleCount || 0,
    icon: this.icon,
    color: this.color,
    isPublished: this.isPublished,
    isFeatured: this.isFeatured,
    enrollmentCount: this.enrollmentCount || 0,
    completionCount: this.completionCount || 0,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const LearningPath: Model<ILearningPath> =
  mongoose.models.LearningPath ||
  mongoose.model<ILearningPath>('LearningPath', LearningPathSchema);
