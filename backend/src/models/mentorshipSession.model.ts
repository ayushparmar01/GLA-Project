import mongoose, { Schema, Document, Model } from 'mongoose';
import { MentorshipSessionData, MentorshipSessionStatus, MentorshipSessionType } from '../types/index.js';

export interface IMentorshipSession extends Document {
  relationshipId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  title: string;
  sessionTopic: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  durationMinutes: number;
  sessionType: MentorshipSessionType;
  meetingLink: string;
  status: MentorshipSessionStatus;
  cancellationReason?: string;
  agenda: string[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): MentorshipSessionData;
}

const MentorshipSessionSchema = new Schema<IMentorshipSession>(
  {
    relationshipId: {
      type: Schema.Types.ObjectId,
      ref: 'MentorshipRelationship',
      required: [true, 'Relationship ID is required'],
      index: true,
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor ID is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Session title is required'],
      trim: true,
      maxlength: 200,
    },
    sessionTopic: {
      type: String,
      required: [true, 'Session topic is required'],
      trim: true,
      maxlength: 200,
    },
    scheduledStart: {
      type: Date,
      required: [true, 'Scheduled start time is required'],
      index: true,
    },
    scheduledEnd: {
      type: Date,
      required: [true, 'Scheduled end time is required'],
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 45,
      min: 15,
      max: 180,
    },
    sessionType: {
      type: String,
      enum: ['ONE_ON_ONE', 'GROUP'],
      default: 'ONE_ON_ONE',
    },
    meetingLink: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
      default: 'CONFIRMED',
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    agenda: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for mentorship session queries & conflict checking
MentorshipSessionSchema.index({ mentorId: 1, scheduledStart: 1 });
MentorshipSessionSchema.index({ studentId: 1, scheduledStart: 1 });
MentorshipSessionSchema.index({ mentorId: 1, status: 1 });

MentorshipSessionSchema.methods.toSafeObject = function (): MentorshipSessionData {
  return {
    id: this._id ? this._id.toString() : '',
    relationshipId: this.relationshipId ? this.relationshipId.toString() : '',
    mentorId: this.mentorId ? this.mentorId.toString() : '',
    studentId: this.studentId ? this.studentId.toString() : '',
    title: this.title,
    sessionTopic: this.sessionTopic,
    scheduledStart: this.scheduledStart ? this.scheduledStart.toISOString() : new Date().toISOString(),
    scheduledEnd: this.scheduledEnd ? this.scheduledEnd.toISOString() : new Date().toISOString(),
    durationMinutes: this.durationMinutes || 45,
    sessionType: this.sessionType || 'ONE_ON_ONE',
    meetingLink: this.meetingLink || '',
    status: this.status,
    cancellationReason: this.cancellationReason,
    agenda: this.agenda || [],
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const MentorshipSession: Model<IMentorshipSession> =
  mongoose.models.MentorshipSession ||
  mongoose.model<IMentorshipSession>('MentorshipSession', MentorshipSessionSchema);
