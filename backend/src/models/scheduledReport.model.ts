import mongoose, { Schema, Document, Model } from 'mongoose';
import { ScheduledReportData, ReportFormat, ReportScopeType } from '../types/index.js';

export interface IScheduledReport extends Document {
  scheduleId: string;
  title: string;
  reportType: string;
  scopeType: ReportScopeType;
  scopeId: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  format: ReportFormat;
  recipients: string[];
  filters: Record<string, any>;
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  lastRunStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
  lastRunError?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): ScheduledReportData;
}

const ScheduledReportSchema = new Schema<IScheduledReport>(
  {
    scheduleId: {
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
    frequency: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
      default: 'WEEKLY',
      index: true,
    },
    format: {
      type: String,
      enum: ['CSV', 'PDF'],
      default: 'PDF',
    },
    recipients: {
      type: [String],
      default: [],
    },
    filters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastRunAt: {
      type: Date,
    },
    nextRunAt: {
      type: Date,
    },
    lastRunStatus: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PENDING'],
      default: 'PENDING',
    },
    lastRunError: {
      type: String,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ScheduledReportSchema.methods.toSafeObject = function (this: IScheduledReport): ScheduledReportData {
  return {
    id: this.scheduleId,
    title: this.title,
    reportType: this.reportType,
    scopeType: this.scopeType,
    scopeId: this.scopeId,
    frequency: this.frequency,
    format: this.format,
    recipients: this.recipients || [],
    filters: this.filters || {},
    enabled: this.enabled,
    lastRunAt: this.lastRunAt ? this.lastRunAt.toISOString() : undefined,
    nextRunAt: this.nextRunAt ? this.nextRunAt.toISOString() : undefined,
    lastRunStatus: this.lastRunStatus,
    lastRunError: this.lastRunError,
    createdBy: this.createdBy,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const ScheduledReport: Model<IScheduledReport> =
  mongoose.models.ScheduledReport ||
  mongoose.model<IScheduledReport>('ScheduledReport', ScheduledReportSchema);
