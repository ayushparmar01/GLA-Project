import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  LearningResourceData,
  ResourceType,
  LearningResourceVerificationStatus,
} from '../types/index.js';

export interface ILearningResource extends Document {
  resourceId: string;
  title: string;
  topic: string;
  skill: string;
  skills: string[];
  category: string;
  tags: string[];
  resourceType: ResourceType | string;
  provider: string;
  url: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  description: string;
  estimatedDuration?: string;
  durationMinutes?: number;
  thumbnailUrl?: string;
  language?: string;
  verificationStatus: LearningResourceVerificationStatus;
  isPublished: boolean;
  rating: number;
  reviewCount: number;
  clickCount: number;
  bookmarkCount: number;
  completionCount: number;
  createdBy?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): LearningResourceData;
}

const LearningResourceSchema = new Schema<ILearningResource>(
  {
    resourceId: {
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
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    skill: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    resourceType: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    estimatedDuration: {
      type: String,
      default: '1-2 hours',
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'en',
    },
    verificationStatus: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'ARCHIVED'],
      default: 'VERIFIED',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 120,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    bookmarkCount: {
      type: Number,
      default: 0,
    },
    completionCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      default: 'SYSTEM',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

LearningResourceSchema.methods.toSafeObject = function (
  this: ILearningResource
): LearningResourceData {
  return {
    id: this.resourceId || (this._id as string | mongoose.Types.ObjectId).toString(),
    title: this.title,
    topic: this.topic,
    skill: this.skill,
    skills: this.skills && this.skills.length > 0 ? this.skills : [this.skill],
    category: this.category || 'General',
    tags: this.tags || [],
    resourceType: this.resourceType,
    provider: this.provider,
    url: this.url,
    difficulty: this.difficulty,
    description: this.description,
    estimatedDuration: this.estimatedDuration || '1-2 hours',
    durationMinutes: this.durationMinutes || 60,
    thumbnailUrl: this.thumbnailUrl || '',
    language: this.language || 'en',
    verificationStatus: this.verificationStatus || 'VERIFIED',
    isPublished: this.isPublished !== undefined ? this.isPublished : true,
    rating: this.rating !== undefined ? this.rating : 4.8,
    reviewCount: this.reviewCount || 0,
    clickCount: this.clickCount || 0,
    bookmarkCount: this.bookmarkCount || 0,
    completionCount: this.completionCount || 0,
    createdBy: this.createdBy || 'SYSTEM',
    isVerified: this.isVerified,
    isActive: this.isActive,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const LearningResource: Model<ILearningResource> =
  mongoose.models.LearningResource ||
  mongoose.model<ILearningResource>('LearningResource', LearningResourceSchema);
