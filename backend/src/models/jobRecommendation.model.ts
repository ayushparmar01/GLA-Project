import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  MatchCategory,
  EligibilityStatus,
  JobRecommendationData,
  RecommendationScoreBreakdown,
  RecommendationExplanation,
  EligibilityResult,
} from '../types/index.js';

export interface IJobRecommendation extends Document {
  studentId: Types.ObjectId;
  jobId: Types.ObjectId;
  matchScore: number;
  scoreCoverage: number;
  matchCategory: MatchCategory;
  eligibilityStatus: EligibilityStatus;
  readinessScore: number;
  scoreBreakdown: RecommendationScoreBreakdown;
  explanation: RecommendationExplanation;
  recommendedActions: string[];
  scoringVersion: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(eligibility?: EligibilityResult, driveData?: any): JobRecommendationData;
}

const JobRecommendationSchema = new Schema<IJobRecommendation>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: [true, 'Job/Drive ID is required'],
      index: true,
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    scoreCoverage: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    matchCategory: {
      type: String,
      enum: ['EXCELLENT_MATCH', 'STRONG_MATCH', 'MODERATE_MATCH', 'LOW_MATCH'],
      required: true,
      index: true,
    },
    eligibilityStatus: {
      type: String,
      enum: ['ELIGIBLE', 'NOT_ELIGIBLE', 'NEEDS_VERIFICATION', 'INCOMPLETE_PROFILE'],
      required: true,
      index: true,
    },
    readinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    scoreBreakdown: {
      skillsScore: { type: Number, default: 0 },
      educationScore: { type: Number, default: 0 },
      assessmentScore: { type: Number, default: 0 },
      experienceScore: { type: Number, default: 0 },
      locationScore: { type: Number, default: 0 },
      rolePreferenceScore: { type: Number, default: 0 },
    },
    explanation: {
      matchingSkills: [{ type: String, trim: true }],
      missingSkills: [{ type: String, trim: true }],
      academicCompatibility: { type: String, default: '' },
      assessmentCompatibility: { type: String, default: '' },
      preferenceCompatibility: { type: String, default: '' },
      recommendedActions: [{ type: String, trim: true }],
    },
    recommendedActions: [{ type: String, trim: true }],
    scoringVersion: {
      type: String,
      default: 'v13.0',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-performance lookup
JobRecommendationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
JobRecommendationSchema.index({ studentId: 1, matchScore: -1 });
JobRecommendationSchema.index({ studentId: 1, eligibilityStatus: 1 });

JobRecommendationSchema.methods.toSafeObject = function (
  this: IJobRecommendation,
  eligibility?: EligibilityResult,
  driveData?: any
): JobRecommendationData {
  const defaultEligibility: EligibilityResult = {
    eligible: this.eligibilityStatus === 'ELIGIBLE',
    status: this.eligibilityStatus,
    reasons: [],
    missingRequirements: [],
    checkedAt: this.generatedAt.toISOString(),
  };

  return {
    jobId: this.jobId.toString(),
    drive: driveData,
    matchScore: this.matchScore,
    scoreCoverage: this.scoreCoverage,
    matchCategory: this.matchCategory,
    eligibilityStatus: this.eligibilityStatus,
    eligibility: eligibility || defaultEligibility,
    readinessScore: this.readinessScore,
    scoreBreakdown: {
      skillsScore: this.scoreBreakdown.skillsScore,
      educationScore: this.scoreBreakdown.educationScore,
      assessmentScore: this.scoreBreakdown.assessmentScore,
      experienceScore: this.scoreBreakdown.experienceScore,
      locationScore: this.scoreBreakdown.locationScore,
      rolePreferenceScore: this.scoreBreakdown.rolePreferenceScore,
    },
    explanation: {
      matchingSkills: this.explanation?.matchingSkills || [],
      missingSkills: this.explanation?.missingSkills || [],
      academicCompatibility: this.explanation?.academicCompatibility || '',
      assessmentCompatibility: this.explanation?.assessmentCompatibility || '',
      preferenceCompatibility: this.explanation?.preferenceCompatibility || '',
      recommendedActions: this.explanation?.recommendedActions || [],
    },
    recommendedActions: this.recommendedActions || [],
    generatedAt: this.generatedAt ? this.generatedAt.toISOString() : new Date().toISOString(),
  };
};

export const JobRecommendation: Model<IJobRecommendation> = mongoose.model<IJobRecommendation>(
  'JobRecommendation',
  JobRecommendationSchema
);
