import mongoose, { Schema, Document, Model } from 'mongoose';
import { MentorshipGroupData } from '../types/index.js';

export interface IMentorshipGroup extends Document {
  mentorId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  topic: string;
  maximumParticipants: number;
  currentParticipantCount: number;
  memberIds: mongoose.Types.ObjectId[];
  scheduledStart: Date;
  scheduledEnd: Date;
  meetingLink: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(extra?: { mentorName?: string; mentorOrganization?: string }): MentorshipGroupData;
}

const MentorshipGroupSchema = new Schema<IMentorshipGroup>(
  {
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Group session title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Group session description is required'],
      trim: true,
      maxlength: 2000,
    },
    topic: {
      type: String,
      required: [true, 'Topic is required'],
      trim: true,
      index: true,
    },
    maximumParticipants: {
      type: Number,
      default: 20,
      min: 2,
      max: 100,
    },
    currentParticipantCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    memberIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    scheduledStart: {
      type: Date,
      required: [true, 'Scheduled start time is required'],
    },
    scheduledEnd: {
      type: Date,
      required: [true, 'Scheduled end time is required'],
    },
    meetingLink: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MentorshipGroupSchema.methods.toSafeObject = function (extra?: {
  mentorName?: string;
  mentorOrganization?: string;
}): MentorshipGroupData {
  return {
    id: this._id ? this._id.toString() : '',
    mentorId: this.mentorId ? this.mentorId.toString() : '',
    mentorName: extra?.mentorName,
    mentorOrganization: extra?.mentorOrganization,
    title: this.title,
    description: this.description,
    topic: this.topic,
    maximumParticipants: this.maximumParticipants || 20,
    currentParticipantCount: this.memberIds?.length || this.currentParticipantCount || 0,
    memberIds: (this.memberIds || []).map((id: mongoose.Types.ObjectId) => id.toString()),
    scheduledStart: this.scheduledStart ? this.scheduledStart.toISOString() : new Date().toISOString(),
    scheduledEnd: this.scheduledEnd ? this.scheduledEnd.toISOString() : new Date().toISOString(),
    meetingLink: this.meetingLink || '',
    status: this.status,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const MentorshipGroup: Model<IMentorshipGroup> =
  mongoose.models.MentorshipGroup || mongoose.model<IMentorshipGroup>('MentorshipGroup', MentorshipGroupSchema);
