import mongoose, { Schema, Document, Model } from 'mongoose';
import { StudentMentorshipProfileData, MentorshipSessionType } from '../types/index.js';

export interface IStudentMentorshipProfile extends Document {
  studentId: mongoose.Types.ObjectId;
  careerGoals: string[];
  preferredTopics: string[];
  preferredIndustries: string[];
  preferredLanguages: string[];
  preferredSessionTypes: MentorshipSessionType[];
  currentMentorshipCount: number;
  maxConcurrentMentorships: number;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): StudentMentorshipProfileData;
}

const StudentMentorshipProfileSchema = new Schema<IStudentMentorshipProfile>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      unique: true,
      index: true,
    },
    careerGoals: {
      type: [String],
      default: [],
      index: true,
    },
    preferredTopics: {
      type: [String],
      default: [],
      index: true,
    },
    preferredIndustries: {
      type: [String],
      default: [],
      index: true,
    },
    preferredLanguages: {
      type: [String],
      default: ['English'],
    },
    preferredSessionTypes: {
      type: [String],
      enum: ['ONE_ON_ONE', 'GROUP'],
      default: ['ONE_ON_ONE', 'GROUP'],
    },
    currentMentorshipCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxConcurrentMentorships: {
      type: Number,
      default: 2,
      min: 1,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

StudentMentorshipProfileSchema.methods.toSafeObject = function (): StudentMentorshipProfileData {
  return {
    id: this._id ? this._id.toString() : '',
    studentId: this.studentId ? this.studentId.toString() : '',
    careerGoals: this.careerGoals || [],
    preferredTopics: this.preferredTopics || [],
    preferredIndustries: this.preferredIndustries || [],
    preferredLanguages: this.preferredLanguages || ['English'],
    preferredSessionTypes: this.preferredSessionTypes || ['ONE_ON_ONE', 'GROUP'],
    currentMentorshipCount: this.currentMentorshipCount || 0,
    maxConcurrentMentorships: this.maxConcurrentMentorships || 2,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const StudentMentorshipProfile: Model<IStudentMentorshipProfile> =
  mongoose.models.StudentMentorshipProfile ||
  mongoose.model<IStudentMentorshipProfile>('StudentMentorshipProfile', StudentMentorshipProfileSchema);
