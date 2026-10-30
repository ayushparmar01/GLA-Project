import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyticsSnapshot extends Document {
  snapshotId: string;
  snapshotType: 'STUDENT' | 'COLLEGE' | 'EMPLOYER' | 'ADMIN';
  scopeType: 'STUDENT' | 'COLLEGE' | 'EMPLOYER' | 'PLATFORM';
  scopeId: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  metrics: Record<string, any>;
  generatedAt: Date;
  expiresAt: Date;
  calculationVersion: string;
  toSafeObject(): Record<string, any>;
}

const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>(
  {
    snapshotId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    snapshotType: {
      type: String,
      enum: ['STUDENT', 'COLLEGE', 'EMPLOYER', 'ADMIN'],
      required: true,
      index: true,
    },
    scopeType: {
      type: String,
      enum: ['STUDENT', 'COLLEGE', 'EMPLOYER', 'PLATFORM'],
      required: true,
      index: true,
    },
    scopeId: {
      type: String,
      required: true,
      index: true,
    },
    period: {
      type: String,
      required: true,
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    metrics: {
      type: Schema.Types.Mixed,
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL expiration
    },
    calculationVersion: {
      type: String,
      default: 'v18.0',
    },
  },
  {
    timestamps: true,
  }
);

AnalyticsSnapshotSchema.index(
  { scopeType: 1, scopeId: 1, period: 1 },
  { unique: true }
);

AnalyticsSnapshotSchema.methods.toSafeObject = function (this: IAnalyticsSnapshot) {
  return {
    id: this.snapshotId,
    snapshotType: this.snapshotType,
    scopeType: this.scopeType,
    scopeId: this.scopeId,
    period: this.period,
    periodStart: this.periodStart ? this.periodStart.toISOString() : undefined,
    periodEnd: this.periodEnd ? this.periodEnd.toISOString() : undefined,
    metrics: this.metrics,
    generatedAt: this.generatedAt ? this.generatedAt.toISOString() : new Date().toISOString(),
    expiresAt: this.expiresAt ? this.expiresAt.toISOString() : undefined,
    calculationVersion: this.calculationVersion,
  };
};

export const AnalyticsSnapshot: Model<IAnalyticsSnapshot> =
  mongoose.models.AnalyticsSnapshot ||
  mongoose.model<IAnalyticsSnapshot>('AnalyticsSnapshot', AnalyticsSnapshotSchema);
