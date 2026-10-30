import mongoose, { Schema, Document, Model } from 'mongoose';
import { ResumeVersionData, ExtractedStructuredResume } from '../types/index.js';

export interface IResumeVersion extends Document {
  studentId: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  versionNumber: number;
  structuredData: ExtractedStructuredResume;
  changeSummary: string;
  createdAt: Date;
  toSafeObject(): ResumeVersionData;
}

const ResumeVersionSchema = new Schema<IResumeVersion>(
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
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    structuredData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    changeSummary: {
      type: String,
      default: 'Version update with optimized ATS wording',
      maxlength: [500, 'Change summary cannot exceed 500 characters'],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ResumeVersionSchema.index({ documentId: 1, versionNumber: 1 }, { unique: true });
ResumeVersionSchema.index({ studentId: 1, createdAt: -1 });

ResumeVersionSchema.methods.toSafeObject = function (this: IResumeVersion): ResumeVersionData {
  return {
    id: (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId.toString(),
    documentId: this.documentId.toString(),
    versionNumber: this.versionNumber,
    structuredData: this.structuredData,
    changeSummary: this.changeSummary,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

export const ResumeVersion: Model<IResumeVersion> =
  mongoose.models.ResumeVersion ||
  mongoose.model<IResumeVersion>('ResumeVersion', ResumeVersionSchema);
