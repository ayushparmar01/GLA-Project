import mongoose, { Schema, Document, Model } from 'mongoose';
import { ReportHistoryData, ReportFormat, ReportScopeType } from '../types/index.js';

export interface IReportHistory extends Document {
  reportId: string;
  title: string;
  reportType: string;
  format: ReportFormat;
  scopeType: ReportScopeType;
  scopeId: string;
  generatedBy: string;
  generatedAt: Date;
  period: string;
  filters: Record<string, any>;
  summary: Record<string, any>;
  fileContent: string;
  fileName: string;
  fileSizeBytes: number;
  status: 'COMPLETED' | 'FAILED';
  expiresAt?: Date;
  toSafeObject(): ReportHistoryData;
}

const ReportHistorySchema = new Schema<IReportHistory>(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    reportType: {
      type: String,
      required: true,
      index: true,
    },
    format: {
      type: String,
      enum: ['CSV', 'PDF'],
      default: 'CSV',
    },
    scopeType: {
      type: String,
      enum: ['STUDENT', 'COLLEGE', 'EMPLOYER', 'ADMIN'],
      required: true,
      index: true,
    },
    scopeId: {
      type: String,
      required: true,
      index: true,
    },
    generatedBy: {
      type: String,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    period: {
      type: String,
      default: 'ALL',
    },
    filters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    summary: {
      type: Schema.Types.Mixed,
      default: {},
    },
    fileContent: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'FAILED'],
      default: 'COMPLETED',
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ReportHistorySchema.index({ scopeType: 1, scopeId: 1, generatedAt: -1 });

ReportHistorySchema.methods.toSafeObject = function (this: IReportHistory): ReportHistoryData {
  return {
    id: this.reportId,
    title: this.title,
    reportType: this.reportType,
    format: this.format,
    scopeType: this.scopeType,
    scopeId: this.scopeId,
    generatedBy: this.generatedBy,
    generatedAt: this.generatedAt ? this.generatedAt.toISOString() : new Date().toISOString(),
    period: this.period,
    filters: this.filters || {},
    summary: this.summary || {},
    fileContent: this.fileContent,
    fileName: this.fileName,
    fileSizeBytes: this.fileSizeBytes || 0,
    status: this.status,
    expiresAt: this.expiresAt ? this.expiresAt.toISOString() : undefined,
  };
};

export const ReportHistory: Model<IReportHistory> =
  mongoose.models.ReportHistory ||
  mongoose.model<IReportHistory>('ReportHistory', ReportHistorySchema);
