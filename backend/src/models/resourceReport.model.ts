import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  ResourceReportData,
  ResourceReportReason,
  ResourceReportStatus,
} from '../types/index.js';

export interface IResourceReport extends Document {
  reportId: string;
  studentId: string;
  resourceId: string;
  reason: ResourceReportReason;
  details: string;
  status: ResourceReportStatus;
  adminNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): ResourceReportData;
}

const ResourceReportSchema = new Schema<IResourceReport>(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: [
        'BROKEN_LINK',
        'OUTDATED_CONTENT',
        'INACCURATE_INFORMATION',
        'INAPPROPRIATE',
        'OTHER',
      ],
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'],
      default: 'PENDING',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ResourceReportSchema.methods.toSafeObject = function (
  this: IResourceReport
): ResourceReportData {
  return {
    id: this.reportId || (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId,
    resourceId: this.resourceId,
    reason: this.reason,
    details: this.details,
    status: this.status,
    adminNotes: this.adminNotes,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    reviewedAt: this.reviewedAt ? this.reviewedAt.toISOString() : undefined,
  };
};

export const ResourceReport: Model<IResourceReport> =
  mongoose.models.ResourceReport ||
  mongoose.model<IResourceReport>('ResourceReport', ResourceReportSchema);
