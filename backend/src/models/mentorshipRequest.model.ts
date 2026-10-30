import mongoose, { Schema, Document, Model } from 'mongoose';
import { MentorshipRequestData, MentorshipRequestStatus, MentorshipSessionType } from '../types/index.js';

export interface IMentorshipRequest extends Document {
  studentId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  mentorProfileId: mongoose.Types.ObjectId;
  topic: string;
  objective: string;
  introduction: string;
  preferredFormat: MentorshipSessionType;
  status: MentorshipRequestStatus;
  responseMessage?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(extra?: { studentName?: string; studentEmail?: string; mentorName?: string }): MentorshipRequestData;
}

const MentorshipRequestSchema = new Schema<IMentorshipRequest>(
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
    topic: {
      type: String,
      required: [true, 'Mentorship topic is required'],
      trim: true,
      maxlength: 200,
    },
    objective: {
      type: String,
      required: [true, 'Mentorship objective is required'],
      trim: true,
      maxlength: 1000,
    },
    introduction: {
      type: String,
      required: [true, 'Personal introduction is required'],
      trim: true,
      maxlength: 2000,
    },
    preferredFormat: {
      type: String,
      enum: ['ONE_ON_ONE', 'GROUP'],
      default: 'ONE_ON_ONE',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    responseMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

MentorshipRequestSchema.methods.toSafeObject = function (extra?: {
  studentName?: string;
  studentEmail?: string;
  mentorName?: string;
}): MentorshipRequestData {
  return {
    id: this._id ? this._id.toString() : '',
    studentId: this.studentId ? this.studentId.toString() : '',
    studentName: extra?.studentName,
    studentEmail: extra?.studentEmail,
    mentorId: this.mentorId ? this.mentorId.toString() : '',
    mentorName: extra?.mentorName,
    mentorProfileId: this.mentorProfileId ? this.mentorProfileId.toString() : '',
    topic: this.topic,
    objective: this.objective,
    introduction: this.introduction,
    preferredFormat: this.preferredFormat || 'ONE_ON_ONE',
    status: this.status,
    responseMessage: this.responseMessage,
    respondedAt: this.respondedAt ? this.respondedAt.toISOString() : undefined,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const MentorshipRequest: Model<IMentorshipRequest> =
  mongoose.models.MentorshipRequest || mongoose.model<IMentorshipRequest>('MentorshipRequest', MentorshipRequestSchema);
