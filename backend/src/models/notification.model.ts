import mongoose, { Schema, Document, Model } from 'mongoose';
import { NotificationData, NotificationType, RelatedEntityType } from '../types/index.js';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string;
  readAt?: Date | null;
  createdAt: Date;
  expiresAt?: Date;
  toSafeObject(): NotificationData;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'APPLICATION_SUBMITTED',
        'APPLICATION_STATUS_CHANGED',
        'INTERVIEW_SCHEDULED',
        'INTERVIEW_RESCHEDULED',
        'INTERVIEW_CANCELLED',
        'DRIVE_PUBLISHED',
        'DRIVE_DEADLINE_REMINDER',
        'CONNECTION_REQUEST',
        'CONNECTION_ACCEPTED',
        'CONNECTION_REJECTED',
        'EVENT_ANNOUNCEMENT',
        'EVENT_REGISTRATION_CONFIRMED',
        'ROADMAP_REMINDER',
        'SYSTEM_ANNOUNCEMENT',
      ],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    relatedEntityType: {
      type: String,
      enum: [
        'APPLICATION',
        'INTERVIEW',
        'PLACEMENT_DRIVE',
        'COLLEGE_CONNECTION',
        'CAREER_EVENT',
        'ROADMAP',
        'ANNOUNCEMENT',
        'SYSTEM',
      ],
      default: undefined,
    },
    relatedEntityId: {
      type: String,
      trim: true,
      default: undefined,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for querying a user's notifications sorted by creation date
NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, readAt: 1 });

NotificationSchema.methods.toSafeObject = function (this: INotification): NotificationData {
  return {
    id: this._id.toString(),
    recipientId: this.recipientId.toString(),
    type: this.type,
    title: this.title,
    message: this.message,
    relatedEntityType: this.relatedEntityType,
    relatedEntityId: this.relatedEntityId,
    readAt: this.readAt ? this.readAt.toISOString() : null,
    createdAt: this.createdAt.toISOString(),
    expiresAt: this.expiresAt ? this.expiresAt.toISOString() : undefined,
    isRead: Boolean(this.readAt),
  };
};

export const Notification: Model<INotification> = mongoose.model<INotification>(
  'Notification',
  NotificationSchema
);
