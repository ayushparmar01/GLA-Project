import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  AtsAnalysisResultData,
  AtsScoreTier,
  AtsScoreBreakdown,
  AtsKeywordAnalysis,
  AtsSkillGapItem,
  AtsResumeQualityReport,
  AtsAiFeedback,
} from '../types/index.js';

export interface IResumeAnalysis extends Document {
  studentId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  jobId?: mongoose.Types.ObjectId;
  jobTitle: string;
  companyName: string;
  isCustomJob: boolean;
  jobDescriptionText: string;
  atsScore: number;
  scoreTier: AtsScoreTier;
  scoreBreakdown: AtsScoreBreakdown;
  dataCoveragePercentage: number;
  reasons: string[];
  keywordAnalysis: AtsKeywordAnalysis;
  skillGapAnalysis: AtsSkillGapItem[];
  qualityReport: AtsResumeQualityReport;
  aiFeedback: AtsAiFeedback;
  disclaimer: string;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): AtsAnalysisResultData;
}

const ResumeAnalysisSchema = new Schema<IResumeAnalysis>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'ResumeDocument',
      required: [true, 'Document ID is required'],
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      index: true,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [150, 'Job title cannot exceed 150 characters'],
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [150, 'Company name cannot exceed 150 characters'],
    },
    isCustomJob: {
      type: Boolean,
      default: false,
    },
    jobDescriptionText: {
      type: String,
      required: [true, 'Job description text is required'],
      maxlength: [20000, 'Job description text exceeds maximum limit'],
    },
    atsScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    scoreTier: {
      type: String,
      enum: ['STRONG_ALIGNMENT', 'GOOD_ALIGNMENT', 'MODERATE_ALIGNMENT', 'NEEDS_IMPROVEMENT'],
      required: true,
    },
    scoreBreakdown: {
      type: Schema.Types.Mixed,
      required: true,
    },
    dataCoveragePercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    reasons: {
      type: [String],
      default: [],
    },
    keywordAnalysis: {
      type: Schema.Types.Mixed,
      required: true,
    },
    skillGapAnalysis: {
      type: Schema.Types.Mixed,
      required: true,
    },
    qualityReport: {
      type: Schema.Types.Mixed,
      required: true,
    },
    aiFeedback: {
      type: Schema.Types.Mixed,
      required: true,
    },
    disclaimer: {
      type: String,
      default:
        'ATS Compatibility Score is an internal algorithmic preparation guidance metric. It does not represent or guarantee actual employer ATS decisions, shortlisting, or recruitment outcomes.',
    },
  },
  {
    timestamps: true,
  }
);

ResumeAnalysisSchema.index({ studentId: 1, createdAt: -1 });

ResumeAnalysisSchema.methods.toSafeObject = function (this: IResumeAnalysis): AtsAnalysisResultData {
  return {
    id: (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId.toString(),
    documentId: this.documentId.toString(),
    jobId: this.jobId ? this.jobId.toString() : undefined,
    jobTitle: this.jobTitle,
    companyName: this.companyName,
    isCustomJob: this.isCustomJob,
    jobDescriptionText: this.jobDescriptionText,
    atsScore: this.atsScore,
    scoreTier: this.scoreTier,
    scoreBreakdown: this.scoreBreakdown,
    dataCoveragePercentage: this.dataCoveragePercentage,
    reasons: this.reasons || [],
    keywordAnalysis: this.keywordAnalysis,
    skillGapAnalysis: this.skillGapAnalysis,
    qualityReport: this.qualityReport,
    aiFeedback: this.aiFeedback,
    disclaimer: this.disclaimer,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

export const ResumeAnalysis: Model<IResumeAnalysis> =
  mongoose.models.ResumeAnalysis ||
  mongoose.model<IResumeAnalysis>('ResumeAnalysis', ResumeAnalysisSchema);

// Export aliases for backward compatibility and architectural alignment
export const AtsAnalysisResult: Model<IResumeAnalysis> = ResumeAnalysis;
export type IAtsAnalysisResult = IResumeAnalysis;
