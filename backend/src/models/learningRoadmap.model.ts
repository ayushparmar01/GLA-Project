import mongoose, { Schema, Document, Model } from 'mongoose';
import { LearningRoadmapData, RoadmapMilestone, RoadmapStatus } from '../types/index.js';

export interface ILearningRoadmap extends Document {
  studentId: mongoose.Types.ObjectId;
  targetRole: string;
  currentSkillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  skillGaps: Array<{
    skill: string;
    status: 'ASSESSMENT_VERIFIED' | 'SELF_DECLARED' | 'MISSING';
    importance: 'REQUIRED' | 'RECOMMENDED';
  }>;
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    order: number;
    estimatedWeeks: number;
    completed: boolean;
    completedAt?: Date;
    topics: string[];
    projectIdea?: string;
    practiceTasks?: string[];
  }>;
  recommendedTopics: string[];
  resourceReferences: Array<{
    title: string;
    url: string;
    type: string;
    provider: string;
  }>;
  estimatedDuration: string;
  progress: number;
  status: RoadmapStatus;
  isAiGenerated: boolean;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): LearningRoadmapData;
}

const RoadmapMilestoneSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    order: { type: Number, required: true },
    estimatedWeeks: { type: Number, required: true, default: 2 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    topics: { type: [String], default: [] },
    projectIdea: { type: String },
    practiceTasks: { type: [String], default: [] },
  },
  { _id: false }
);

const SkillGapRefSchema = new Schema(
  {
    skill: { type: String, required: true },
    status: {
      type: String,
      enum: ['ASSESSMENT_VERIFIED', 'SELF_DECLARED', 'MISSING'],
      required: true,
    },
    importance: {
      type: String,
      enum: ['REQUIRED', 'RECOMMENDED'],
      default: 'REQUIRED',
    },
  },
  { _id: false }
);

const ResourceRefSchema = new Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    provider: { type: String, required: true },
  },
  { _id: false }
);

const LearningRoadmapSchema = new Schema<ILearningRoadmap>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    targetRole: {
      type: String,
      required: [true, 'Target role is required'],
      trim: true,
    },
    currentSkillLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER',
    },
    skillGaps: {
      type: [SkillGapRefSchema],
      default: [],
    },
    milestones: {
      type: [RoadmapMilestoneSchema],
      default: [],
    },
    recommendedTopics: {
      type: [String],
      default: [],
    },
    resourceReferences: {
      type: [ResourceRefSchema],
      default: [],
    },
    estimatedDuration: {
      type: String,
      default: '12 Weeks',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    isAiGenerated: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

LearningRoadmapSchema.index({ studentId: 1, status: 1 });

LearningRoadmapSchema.methods.toSafeObject = function (this: ILearningRoadmap): LearningRoadmapData {
  const safeMilestones: RoadmapMilestone[] = (this.milestones || []).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    order: m.order,
    estimatedWeeks: m.estimatedWeeks,
    completed: m.completed,
    completedAt: m.completedAt ? m.completedAt.toISOString() : undefined,
    topics: m.topics || [],
    projectIdea: m.projectIdea,
    practiceTasks: m.practiceTasks || [],
  }));

  // Re-compute progress dynamically from milestones if any
  const completedCount = safeMilestones.filter((m) => m.completed).length;
  const calculatedProgress =
    safeMilestones.length > 0 ? Math.round((completedCount / safeMilestones.length) * 100) : 0;

  return {
    id: (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId.toString(),
    targetRole: this.targetRole,
    currentSkillLevel: this.currentSkillLevel,
    skillGaps: this.skillGaps || [],
    milestones: safeMilestones,
    recommendedTopics: this.recommendedTopics || [],
    resourceReferences: this.resourceReferences || [],
    estimatedDuration: this.estimatedDuration,
    progress: calculatedProgress,
    status: calculatedProgress === 100 ? 'COMPLETED' : this.status,
    isAiGenerated: this.isAiGenerated,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const LearningRoadmap: Model<ILearningRoadmap> =
  mongoose.models.LearningRoadmap ||
  mongoose.model<ILearningRoadmap>('LearningRoadmap', LearningRoadmapSchema);
