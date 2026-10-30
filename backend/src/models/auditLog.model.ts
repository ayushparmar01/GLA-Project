import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { AuditLogEntry, Role } from '../types/index.js';

export interface IAuditLog extends Document {
  actorId: Types.ObjectId;
  actorRole: Role;
  action: string;
  resourceType: string;
  resourceId?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  createdAt: Date;
  toSafeObject(): AuditLogEntry;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor ID is required for audit record'],
      index: true,
    },
    actorRole: {
      type: String,
      required: [true, 'Actor role is required'],
      enum: ['STUDENT', 'EMPLOYER', 'COLLEGE', 'ADMIN'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      trim: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: [true, 'Resource type is required'],
      trim: true,
      index: true,
    },
    resourceId: {
      type: String,
      trim: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    requestId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only: no updates allowed
  }
);

AuditLogSchema.methods.toSafeObject = function (this: IAuditLog): AuditLogEntry {
  return {
    id: (this._id as Types.ObjectId).toString(),
    actorId: this.actorId ? this.actorId.toString() : '',
    actorRole: this.actorRole,
    action: this.action,
    resourceType: this.resourceType,
    resourceId: this.resourceId,
    reason: this.reason,
    metadata: this.metadata,
    requestId: this.requestId,
    timestamp: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

export const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
