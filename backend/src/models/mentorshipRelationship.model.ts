import mongoose, { Schema, Document, Model } from 'mongoose';
import { MentorshipRelationshipData, MentorshipRelationshipStatus } from '../types/index.js';

export interface IMentorshipRelationship extends Document {
  studentId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  mentorProfileId: mongoose.Types.ObjectId;
  requestId: mongoose.Types.ObjectId;
  topic: string;
  primaryObjective: string;
  status: MentorshipRelationshipStatus;
  startDate: Date;
  endDate?: Date;
  completedSessions: number;
  totalGoals: number;
  completedGoals: number;
  overallProgress: number;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(extra?: {
    studentName?: string;
    mentorName?: string;
    mentorOrganization?: string;
    mentorDesignation?: string;
  }): MentorshipRelationshipData;
}

const MentorshipRelationshipSchema = new Schema<IMentorshipRelationship>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor ID is required'],
      index: true,
    },
    mentorProfileId: {
      type: Schema.Types.ObjectId,
      ref: 'MentorProfile',
      required: [true, 'Mentor Profile ID is required'],
      index: true,
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: 'MentorshipRequest',
      required: [true, 'Request ID is required'],
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    primaryObjective: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'TERMINATED'],
      default: 'ACTIVE',
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    completedSessions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalGoals: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedGoals: {
      type: Number,
      default: 0,
      min: 0,
    },
    overallProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

MentorshipRelationshipSchema.methods.toSafeObject = function (extra?: {
  studentName?: string;
  mentorName?: string;
  mentorOrganization?: string;
  mentorDesignation?: string;
}): MentorshipRelationshipData {
  return {
    id: this._id ? this._id.toString() : '',
    studentId: this.studentId ? this.studentId.toString() : '',
    studentName: extra?.studentName,
    mentorId: this.mentorId ? this.mentorId.toString() : '',
    mentorName: extra?.mentorName,
    mentorOrganization: extra?.mentorOrganization,
    mentorDesignation: extra?.mentorDesignation,
    mentorProfileId: this.mentorProfileId ? this.mentorProfileId.toString() : '',
    requestId: this.requestId ? this.requestId.toString() : '',
    topic: this.topic,
    primaryObjective: this.primaryObjective || '',
    status: this.status,
    startDate: this.startDate ? this.startDate.toISOString() : new Date().toISOString(),
    endDate: this.endDate ? this.endDate.toISOString() : undefined,
    completedSessions: this.completedSessions || 0,
    totalGoals: this.totalGoals || 0,
    completedGoals: this.completedGoals || 0,
    overallProgress: this.overallProgress || 0,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const MentorshipRelationship: Model<IMentorshipRelationship> =
  mongoose.models.MentorshipRelationship ||
  mongoose.model<IMentorshipRelationship>('MentorshipRelationship', MentorshipRelationshipSchema);
