import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { MatchingWeightsConfig, RecommendationConfigurationData } from '../types/index.js';

export interface IRecommendationConfiguration extends Document {
  scoringWeights: MatchingWeightsConfig;
  scoringVersion: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): RecommendationConfigurationData;
}

const RecommendationConfigurationSchema = new Schema<IRecommendationConfiguration>(
  {
    scoringWeights: {
      skills: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 35,
      },
      education: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 20,
      },
      assessment: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 15,
      },
      experience: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 10,
      },
      location: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 10,
      },
      rolePreference: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 10,
      },
    },
    scoringVersion: {
      type: String,
      default: 'v13.0',
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

RecommendationConfigurationSchema.pre<IRecommendationConfiguration>('save', function (next) {
  const w = this.scoringWeights;
  const total =
    (w.skills || 0) +
    (w.education || 0) +
    (w.assessment || 0) +
    (w.experience || 0) +
    (w.location || 0) +
    (w.rolePreference || 0);

  if (Math.round(total) !== 100) {
    return next(new Error(`Total weights must sum to 100%. Current sum: ${total}%`));
  }
  next();
});

RecommendationConfigurationSchema.methods.toSafeObject = function (
  this: IRecommendationConfiguration
): RecommendationConfigurationData {
  return {
    scoringWeights: {
      skills: this.scoringWeights.skills,
      education: this.scoringWeights.education,
      assessment: this.scoringWeights.assessment,
      experience: this.scoringWeights.experience,
      location: this.scoringWeights.location,
      rolePreference: this.scoringWeights.rolePreference,
    },
    scoringVersion: this.scoringVersion,
    updatedBy: this.updatedBy?.toString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const RecommendationConfiguration: Model<IRecommendationConfiguration> =
  mongoose.model<IRecommendationConfiguration>(
    'RecommendationConfiguration',
    RecommendationConfigurationSchema
  );
