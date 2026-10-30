import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  ModerationItemData,
  ModerationItemTargetType,
  ModerationItemStatus,
} from '../types/index.js';

export interface IModerationItem extends Document {
  targetType: ModerationItemTargetType;
  targetId: string;
  targetTitle?: string;
  reason: string;
  flaggedBy?: Types.ObjectId;
  flaggedByName?: string;
  status: ModerationItemStatus;
  moderatorNotes?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): ModerationItemData;
}

const ModerationItemSchema = new Schema<IModerationItem>(
  {
    targetType: {
      type: String,
      required: [true, 'Target type is required'],
      enum: {
        values: ['OPPORTUNITY', 'EMPLOYER_PROFILE', 'ANNOUNCEMENT', 'EVENT', 'USER_CONTENT'],
        message: 'Invalid target type for moderation item',
      },
      index: true,
    },
    targetId: {
      type: String,
      required: [true, 'Target ID is required'],
      trim: true,
      index: true,
    },
    targetTitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Target title cannot exceed 200 characters'],
    },
    reason: {
      type: String,
      required: [true, 'Moderation reason or report description is required'],
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
    flaggedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    flaggedByName: {
      type: String,
      trim: true,
      maxlength: [100, 'Flagged by name cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'APPROVED', 'REJECTED', 'DISMISSED', 'ACTION_TAKEN'],
        message: 'Invalid moderation status',
      },
      default: 'PENDING',
      index: true,
    },
    moderatorNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Moderator notes cannot exceed 1000 characters'],
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ModerationItemSchema.methods.toSafeObject = function (this: IModerationItem): ModerationItemData {
  return {
    id: (this._id as Types.ObjectId).toString(),
    targetType: this.targetType,
    targetId: this.targetId,
    targetTitle: this.targetTitle,
    reason: this.reason,
    flaggedBy: this.flaggedBy ? this.flaggedBy.toString() : undefined,
    flaggedByName: this.flaggedByName,
    status: this.status,
    moderatorNotes: this.moderatorNotes,
    reviewedBy: this.reviewedBy ? this.reviewedBy.toString() : undefined,
    reviewedAt: this.reviewedAt ? this.reviewedAt.toISOString() : undefined,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const ModerationItem: Model<IModerationItem> = mongoose.model<IModerationItem>(
  'ModerationItem',
  ModerationItemSchema
);
