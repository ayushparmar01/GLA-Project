import mongoose, { Schema, Document, Model } from 'mongoose';
import { CareerEventData, CareerEventType, CareerEventStatus } from '../types/index.js';

export interface ICareerEvent extends Document {
  title: string;
  description: string;
  eventType: CareerEventType;
  organizerId: mongoose.Types.ObjectId;
  organizerRole: 'COLLEGE' | 'EMPLOYER' | 'ADMIN';
  organizerName?: string;
  collegeId?: mongoose.Types.ObjectId;
  startAt: Date;
  endAt: Date;
  location: string;
  meetingUrl?: string;
  registrationDeadline: Date;
  capacity: number;
  registeredCount: number;
  eligibility?: {
    courses?: string[];
    minCgpa?: number;
    graduationYears?: number[];
  };
  status: CareerEventStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(userId?: string): CareerEventData;
}

const CareerEventSchema = new Schema<ICareerEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: [
        'WEBINAR',
        'WORKSHOP',
        'HACKATHON',
        'CAREER_FAIR',
        'INTERVIEW_DRIVE',
        'TRAINING_SESSION',
      ],
      index: true,
    },
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Organizer ID is required'],
      index: true,
    },
    organizerRole: {
      type: String,
      required: [true, 'Organizer role is required'],
      enum: ['COLLEGE', 'EMPLOYER', 'ADMIN'],
      index: true,
    },
    organizerName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    startAt: {
      type: Date,
      required: [true, 'Start date and time are required'],
      index: true,
    },
    endAt: {
      type: Date,
      required: [true, 'End date and time are required'],
    },
    location: {
      type: String,
      required: [true, 'Location or meeting format is required'],
      trim: true,
      maxlength: 200,
    },
    meetingUrl: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
      index: true,
    },
    capacity: {
      type: Number,
      default: 0, // 0 indicates unlimited capacity
      min: [0, 'Capacity cannot be negative'],
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: [0, 'Registered count cannot be negative'],
    },
    eligibility: {
      courses: [{ type: String, trim: true }],
      minCgpa: { type: Number, min: 0, max: 10 },
      graduationYears: [{ type: Number }],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
      default: 'DRAFT',
      index: true,
    },
    tags: [{ type: String, trim: true, maxlength: 40 }],
  },
  {
    timestamps: true,
  }
);

CareerEventSchema.index({ status: 1, startAt: 1 });
CareerEventSchema.index({ collegeId: 1, status: 1 });

CareerEventSchema.methods.toSafeObject = function (
  this: ICareerEvent,
  userId?: string
): CareerEventData {
  const isFull = this.capacity > 0 && this.registeredCount >= this.capacity;
  const isDeadlinePassed = new Date(this.registrationDeadline).getTime() < Date.now();

  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    eventType: this.eventType,
    organizerId: this.organizerId.toString(),
    organizerRole: this.organizerRole,
    organizerName: this.organizerName,
    collegeId: this.collegeId ? this.collegeId.toString() : undefined,
    startAt: this.startAt.toISOString(),
    endAt: this.endAt.toISOString(),
    location: this.location,
    meetingUrl: this.meetingUrl,
    registrationDeadline: this.registrationDeadline.toISOString(),
    capacity: this.capacity,
    registeredCount: this.registeredCount,
    isFull,
    isDeadlinePassed,
    eligibility: this.eligibility,
    status: this.status,
    tags: this.tags || [],
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const CareerEvent: Model<ICareerEvent> = mongoose.model<ICareerEvent>(
  'CareerEvent',
  CareerEventSchema
);
