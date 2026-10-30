import mongoose, { Schema, Document, Model } from 'mongoose';
import { MentorProfileData, MentorVerificationStatus, MentorTimeSlot, MentorVerificationEvidence } from '../types/index.js';

export interface IMentorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  organization: string;
  designation: string;
  experienceYears: number;
  industry: string;
  expertise: string[];
  mentorshipTopics: string[];
  bio: string;
  languages: string[];
  isAlumni: boolean;
  almaMaterCollegeId?: mongoose.Types.ObjectId;
  almaMaterCollegeName?: string;
  graduationYear?: number;
  branch?: string;
  linkedinUrl?: string;
  maximumMentees: number;
  activeMenteeCount: number;
  verificationStatus: MentorVerificationStatus;
  verificationEvidence?: MentorVerificationEvidence;
  verificationReviewedAt?: Date;
  verificationReviewedBy?: mongoose.Types.ObjectId;
  verificationRejectionReason?: string;
  availableDays: string[];
  timeSlots: MentorTimeSlot[];
  ratingAverage: number;
  totalReviews: number;
  totalSessionsCompleted: number;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(extraUser?: { fullName?: string; email?: string; avatarUrl?: string }): MentorProfileData;
}

const MentorTimeSlotSchema = new Schema(
  {
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  { _id: false }
);

const VerificationEvidenceSchema = new Schema(
  {
    documentUrl: { type: String, trim: true },
    workEmail: { type: String, trim: true },
    idProofUrl: { type: String, trim: true },
    submissionNotes: { type: String, trim: true },
  },
  { _id: false }
);

const MentorProfileSchema = new Schema<IMentorProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for mentor profile'],
      unique: true,
      index: true,
    },
    organization: {
      type: String,
      required: [true, 'Organization / Company is required'],
      trim: true,
      maxlength: 150,
    },
    designation: {
      type: String,
      required: [true, 'Current designation is required'],
      trim: true,
      maxlength: 150,
    },
    experienceYears: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: 0,
      max: 60,
      default: 1,
    },
    industry: {
      type: String,
      required: [true, 'Industry domain is required'],
      trim: true,
      index: true,
    },
    expertise: {
      type: [String],
      default: [],
      index: true,
    },
    mentorshipTopics: {
      type: [String],
      default: [],
      index: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2500,
    },
    languages: {
      type: [String],
      default: ['English'],
    },
    isAlumni: {
      type: Boolean,
      default: false,
      index: true,
    },
    almaMaterCollegeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    almaMaterCollegeName: {
      type: String,
      trim: true,
    },
    graduationYear: {
      type: Number,
      min: 1970,
      max: 2035,
    },
    branch: {
      type: String,
      trim: true,
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
    maximumMentees: {
      type: Number,
      default: 3,
      min: 1,
      max: 50,
    },
    activeMenteeCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
      default: 'PENDING',
      index: true,
    },
    verificationEvidence: {
      type: VerificationEvidenceSchema,
      default: {},
    },
    verificationReviewedAt: {
      type: Date,
    },
    verificationReviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verificationRejectionReason: {
      type: String,
      trim: true,
    },
    availableDays: {
      type: [String],
      default: ['Saturday', 'Sunday'],
    },
    timeSlots: {
      type: [MentorTimeSlotSchema],
      default: [],
    },
    ratingAverage: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSessionsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

MentorProfileSchema.methods.toSafeObject = function (extraUser?: {
  fullName?: string;
  email?: string;
  avatarUrl?: string;
}): MentorProfileData {
  return {
    id: this._id ? this._id.toString() : '',
    userId: this.userId ? this.userId.toString() : '',
    fullName: extraUser?.fullName,
    email: extraUser?.email,
    avatarUrl: extraUser?.avatarUrl,
    organization: this.organization,
    designation: this.designation,
    experienceYears: this.experienceYears,
    industry: this.industry,
    expertise: this.expertise || [],
    mentorshipTopics: this.mentorshipTopics || [],
    bio: this.bio || '',
    languages: this.languages || ['English'],
    isAlumni: Boolean(this.isAlumni),
    almaMaterCollegeId: this.almaMaterCollegeId ? this.almaMaterCollegeId.toString() : undefined,
    almaMaterCollegeName: this.almaMaterCollegeName,
    graduationYear: this.graduationYear,
    branch: this.branch,
    linkedinUrl: this.linkedinUrl,
    maximumMentees: this.maximumMentees,
    activeMenteeCount: this.activeMenteeCount || 0,
    verificationStatus: this.verificationStatus,
    verificationEvidence: this.verificationEvidence,
    verificationReviewedAt: this.verificationReviewedAt ? this.verificationReviewedAt.toISOString() : undefined,
    verificationReviewedBy: this.verificationReviewedBy ? this.verificationReviewedBy.toString() : undefined,
    verificationRejectionReason: this.verificationRejectionReason,
    availableDays: this.availableDays || [],
    timeSlots: this.timeSlots || [],
    ratingAverage: Number(this.ratingAverage || 5.0),
    totalReviews: Number(this.totalReviews || 0),
    totalSessionsCompleted: Number(this.totalSessionsCompleted || 0),
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const MentorProfile: Model<IMentorProfile> =
  mongoose.models.MentorProfile || mongoose.model<IMentorProfile>('MentorProfile', MentorProfileSchema);

// Export aliases for backward compatibility and architectural alignment
export const MentorshipProfile: Model<IMentorProfile> = MentorProfile;
export type IMentorshipProfile = IMentorProfile;
