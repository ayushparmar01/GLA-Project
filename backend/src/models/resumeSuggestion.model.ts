import mongoose, { Schema, Document, Model } from 'mongoose';
import { ResumeSuggestionData } from '../types/index.js';

export interface IResumeSuggestion extends Document {
  studentId: mongoose.Types.ObjectId;
  analysisId: mongoose.Types.ObjectId;
  section: string;
  originalText: string;
  suggestedText: string;
  reason: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  toSafeObject(): ResumeSuggestionData;
}

const ResumeSuggestionSchema = new Schema<IResumeSuggestion>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: 'ResumeAnalysis',
      required: [true, 'Analysis ID is required'],
      index: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    originalText: {
      type: String,
      required: true,
      maxlength: [2000, 'Original text cannot exceed 2000 characters'],
    },
    suggestedText: {
      type: String,
      required: true,
      maxlength: [2000, 'Suggested text cannot exceed 2000 characters'],
    },
    reason: {
      type: String,
      required: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ResumeSuggestionSchema.index({ analysisId: 1, status: 1 });
ResumeSuggestionSchema.index({ studentId: 1, createdAt: -1 });

ResumeSuggestionSchema.methods.toSafeObject = function (this: IResumeSuggestion): ResumeSuggestionData {
  return {
    id: (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId.toString(),
    analysisId: this.analysisId.toString(),
    section: this.section,
    originalText: this.originalText,
    suggestedText: this.suggestedText,
    reason: this.reason,
    status: this.status,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

export const ResumeSuggestion: Model<IResumeSuggestion> =
  mongoose.models.ResumeSuggestion ||
  mongoose.model<IResumeSuggestion>('ResumeSuggestion', ResumeSuggestionSchema);
