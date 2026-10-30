import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  ResumeDocumentData,
  ResumeDocumentFileType,
  ResumeDocumentStatus,
  ExtractedStructuredResume,
} from '../types/index.js';

export interface IResumeDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  fileName: string;
  fileType: ResumeDocumentFileType;
  fileSize: number;
  secureStorageReference: string;
  extractionStatus: ResumeDocumentStatus;
  extractedText: string;
  structuredData: ExtractedStructuredResume;
  rawBufferData?: string;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): ResumeDocumentData;
}

const ResumeDocumentSchema = new Schema<IResumeDocument>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      maxlength: [200, 'File name cannot exceed 200 characters'],
    },
    fileType: {
      type: String,
      enum: ['PDF', 'DOCX'],
      required: [true, 'File type must be PDF or DOCX'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      max: [5242880, 'File size cannot exceed 5MB'],
    },
    secureStorageReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    extractionStatus: {
      type: String,
      enum: ['UPLOADED', 'PARSED', 'ERROR'],
      default: 'UPLOADED',
      index: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    structuredData: {
      type: Schema.Types.Mixed,
      default: () => ({
        contact: {},
        education: [],
        technicalSkills: [],
        softSkills: [],
        workExperience: [],
        projects: [],
        certifications: [],
        achievements: [],
        rawTextLength: 0,
      }),
    },
    rawBufferData: {
      type: String,
      select: false, // Hidden by default from queries for privacy and payload safety
    },
  },
  {
    timestamps: true,
  }
);

ResumeDocumentSchema.index({ studentId: 1, createdAt: -1 });

ResumeDocumentSchema.methods.toSafeObject = function (this: IResumeDocument): ResumeDocumentData {
  return {
    id: (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId.toString(),
    fileName: this.fileName,
    fileType: this.fileType,
    fileSize: this.fileSize,
    extractionStatus: this.extractionStatus,
    extractedText: this.extractedText || '',
    structuredData: this.structuredData || {
      contact: {},
      education: [],
      technicalSkills: [],
      softSkills: [],
      workExperience: [],
      projects: [],
      certifications: [],
      achievements: [],
      rawTextLength: 0,
    },
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const ResumeDocument: Model<IResumeDocument> =
  mongoose.models.ResumeDocument ||
  mongoose.model<IResumeDocument>('ResumeDocument', ResumeDocumentSchema);
