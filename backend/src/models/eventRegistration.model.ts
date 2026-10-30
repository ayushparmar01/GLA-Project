import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  EventRegistrationData,
  EventRegistrationStatus,
  AttendanceStatus,
} from '../types/index.js';

export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  registrationStatus: EventRegistrationStatus;
  registeredAt: Date;
  attendanceStatus: AttendanceStatus;
  studentSnapshot?: {
    fullName: string;
    email: string;
    course?: string;
    collegeName?: string;
    graduationYear?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): EventRegistrationData;
}

const EventRegistrationSchema = new Schema<IEventRegistration>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'CareerEvent',
      required: [true, 'Event ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    registrationStatus: {
      type: String,
      enum: ['REGISTERED', 'CANCELLED', 'WAITLISTED'],
      default: 'REGISTERED',
      index: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    attendanceStatus: {
      type: String,
      enum: ['NOT_RECORDED', 'ATTENDED', 'ABSENT'],
      default: 'NOT_RECORDED',
    },
    studentSnapshot: {
      fullName: { type: String, trim: true },
      email: { type: String, trim: true },
      course: { type: String, trim: true },
      collegeName: { type: String, trim: true },
      graduationYear: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring a student registers at most once per event
EventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });

EventRegistrationSchema.methods.toSafeObject = function (
  this: IEventRegistration
): EventRegistrationData {
  return {
    id: this._id.toString(),
    eventId: this.eventId.toString(),
    userId: this.userId.toString(),
    registrationStatus: this.registrationStatus,
    registeredAt: this.registeredAt.toISOString(),
    attendanceStatus: this.attendanceStatus,
    studentSnapshot: this.studentSnapshot,
  };
};

export const EventRegistration: Model<IEventRegistration> = mongoose.model<IEventRegistration>(
  'EventRegistration',
  EventRegistrationSchema
);
