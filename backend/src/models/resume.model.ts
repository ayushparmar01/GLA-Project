import mongoose, { Schema, Document, Model } from 'mongoose';
import { ResumeData, ResumeTemplate, ResumeStructuredContent } from '../types/index.js';

export interface IResume extends Document {
  studentId: mongoose.Types.ObjectId;
  title: string;
  template: ResumeTemplate;
  structuredContent: ResumeStructuredContent;
  version: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): ResumeData;
}

const ResumeSchema = new Schema<IResume>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Resume title is required'],
      trim: true,
      minlength: [2, 'Resume title must be at least 2 characters'],
      maxlength: [120, 'Resume title cannot exceed 120 characters'],
    },
    template: {
      type: String,
      enum: ['MODERN', 'PROFESSIONAL', 'MINIMAL'],
      default: 'MODERN',
      required: true,
    },
    structuredContent: {
      type: Schema.Types.Mixed,
      required: [true, 'Resume content is required'],
    },
    version: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

ResumeSchema.index({ studentId: 1, title: 1, version: 1 }, { unique: true });
ResumeSchema.index({ studentId: 1, isDefault: 1 });

ResumeSchema.methods.toSafeObject = function (this: IResume): ResumeData {
  return {
    id: (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId.toString(),
    title: this.title,
    template: this.template,
    structuredContent: this.structuredContent,
    version: this.version,
    isDefault: this.isDefault,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const Resume: Model<IResume> = mongoose.model<IResume>('Resume', ResumeSchema);
