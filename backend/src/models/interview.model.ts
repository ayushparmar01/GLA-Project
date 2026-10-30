import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { InterviewData, InterviewType, InterviewStatus } from '../types/index.js';

export interface IInterview extends Document {
  applicationId: Types.ObjectId;
  driveId: Types.ObjectId;
  employerId: Types.ObjectId;
  studentId: Types.ObjectId;
  interviewRound: string;
  interviewType: InterviewType;
  scheduledAt: Date;
  durationMinutes: number;
  meetingLink?: string;
  location?: string;
  instructions?: string;
  status: InterviewStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(extra?: {
    driveTitle?: string;
    companyName?: string;
    studentName?: string;
    studentEmail?: string;
  }): InterviewData;
}

const InterviewSchema = new Schema<IInterview>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'PlacementApplication',
      required: [true, 'Application ID is required'],
      index: true,
    },
    driveId: {
      type: Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: [true, 'Drive ID is required'],
      index: true,
    },
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employer ID is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    interviewRound: {
      type: String,
      required: [true, 'Interview round title is required'],
      trim: true,
      maxlength: [100, 'Round title cannot exceed 100 characters'],
    },
    interviewType: {
      type: String,
      enum: ['ONLINE', 'OFFLINE'],
      required: [true, 'Interview type must be ONLINE or OFFLINE'],
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date and time is required'],
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 30,
      min: [15, 'Minimum interview duration is 15 minutes'],
      max: [240, 'Maximum interview duration is 240 minutes'],
    },
    meetingLink: {
      type: String,
      trim: true,
      maxlength: [500, 'Meeting link cannot exceed 500 characters'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, 'Physical location cannot exceed 200 characters'],
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [1000, 'Instructions cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Optimize multi-criteria lookups
InterviewSchema.index({ employerId: 1, scheduledAt: 1 });
InterviewSchema.index({ studentId: 1, scheduledAt: 1 });

InterviewSchema.methods.toSafeObject = function (
  this: IInterview,
  extra?: {
    driveTitle?: string;
    companyName?: string;
    studentName?: string;
    studentEmail?: string;
  }
): InterviewData {
  return {
    id: (this._id as Types.ObjectId).toString(),
    applicationId: this.applicationId.toString(),
    driveId: this.driveId.toString(),
    employerId: this.employerId.toString(),
    studentId: this.studentId.toString(),
    interviewRound: this.interviewRound,
    interviewType: this.interviewType,
    scheduledAt: this.scheduledAt ? this.scheduledAt.toISOString() : '',
    durationMinutes: this.durationMinutes,
    meetingLink: this.meetingLink,
    location: this.location,
    instructions: this.instructions,
    status: this.status,
    createdBy: this.createdBy.toString(),
    driveTitle: extra?.driveTitle,
    companyName: extra?.companyName,
    studentName: extra?.studentName,
    studentEmail: extra?.studentEmail,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const Interview: Model<IInterview> = mongoose.model<IInterview>('Interview', InterviewSchema);
