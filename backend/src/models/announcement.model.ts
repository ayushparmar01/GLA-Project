import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  AnnouncementData,
  AnnouncementAudience,
  AnnouncementPriority,
} from '../types/index.js';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  authorId: mongoose.Types.ObjectId;
  authorRole: 'COLLEGE' | 'ADMIN';
  authorName: string;
  targetAudience: AnnouncementAudience;
  collegeId?: mongoose.Types.ObjectId;
  cohortId?: mongoose.Types.ObjectId;
  priority: AnnouncementPriority;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): AnnouncementData;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
      maxlength: [3000, 'Content cannot exceed 3000 characters'],
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
      index: true,
    },
    authorRole: {
      type: String,
      required: [true, 'Author role is required'],
      enum: ['COLLEGE', 'ADMIN'],
      index: true,
    },
    authorName: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
      maxlength: 120,
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'COLLEGE_STUDENTS', 'COHORT'],
      default: 'COLLEGE_STUDENTS',
      index: true,
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    cohortId: {
      type: Schema.Types.ObjectId,
      ref: 'Cohort',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
      index: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

AnnouncementSchema.index({ collegeId: 1, createdAt: -1 });
AnnouncementSchema.index({ targetAudience: 1, createdAt: -1 });

AnnouncementSchema.methods.toSafeObject = function (
  this: IAnnouncement
): AnnouncementData {
  return {
    id: this._id.toString(),
    title: this.title,
    content: this.content,
    authorId: this.authorId.toString(),
    authorRole: this.authorRole,
    authorName: this.authorName,
    targetAudience: this.targetAudience,
    collegeId: this.collegeId ? this.collegeId.toString() : undefined,
    cohortId: this.cohortId ? this.cohortId.toString() : undefined,
    priority: this.priority,
    expiresAt: this.expiresAt ? this.expiresAt.toISOString() : undefined,
    createdAt: this.createdAt.toISOString(),
  };
};

export const Announcement: Model<IAnnouncement> = mongoose.model<IAnnouncement>(
  'Announcement',
  AnnouncementSchema
);
