import mongoose, { Schema, Document, Model } from 'mongoose';
import { Role } from '../types/index.js';

export interface IAnalyticsEvent extends Document {
  eventId: string;
  eventType: string;
  actorId: string;
  actorRole: Role;
  institutionId?: string;
  employerId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  toSafeObject(): Record<string, any>;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      required: true,
      index: true,
    },
    institutionId: {
      type: String,
      index: true,
    },
    employerId: {
      type: String,
      index: true,
    },
    entityType: {
      type: String,
      index: true,
    },
    entityId: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

AnalyticsEventSchema.index({ actorId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ institutionId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ employerId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });

AnalyticsEventSchema.methods.toSafeObject = function (this: IAnalyticsEvent) {
  return {
    id: this.eventId,
    eventType: this.eventType,
    actorId: this.actorId,
    actorRole: this.actorRole,
    institutionId: this.institutionId,
    employerId: this.employerId,
    entityType: this.entityType,
    entityId: this.entityId,
    metadata: this.metadata || {},
    timestamp: this.timestamp ? this.timestamp.toISOString() : new Date().toISOString(),
  };
};

export const AnalyticsEvent: Model<IAnalyticsEvent> =
  mongoose.models.AnalyticsEvent ||
  mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
