import mongoose, { Schema, Document, Model } from 'mongoose';
import { Role, SafeUser, StudentProfileData, EmployerProfileData, CollegeProfileData } from '../types/index.js';

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  role: Role;
  preferredLanguage: string;
  phoneNumber?: string;
  isActive: boolean;
  isSuspended?: boolean;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: mongoose.Types.ObjectId;
  studentProfile?: StudentProfileData;
  employerProfile?: EmployerProfileData;
  collegeProfile?: CollegeProfileData;
  createdAt: Date;
  updatedAt: Date;
  calculateStudentScore(): number;
  toSafeObject(): SafeUser;
}

const EducationItemSchema = new Schema(
  {
    id: { type: String },
    institution: { type: String, required: true, trim: true, maxlength: 150 },
    degree: { type: String, required: true, trim: true, maxlength: 100 },
    fieldOfStudy: { type: String, trim: true, maxlength: 100 },
    startYear: { type: Number, min: 1980, max: 2040 },
    endYear: { type: Number, min: 1980, max: 2040 },
    cgpa: { type: Number, min: 0, max: 10 },
    isCurrent: { type: Boolean, default: false },
  },
  { _id: false }
);

const CertificationItemSchema = new Schema(
  {
    id: { type: String },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    issuer: { type: String, required: true, trim: true, maxlength: 150 },
    issueDate: { type: String, trim: true },
    expiryDate: { type: String, trim: true },
    credentialId: { type: String, trim: true, maxlength: 100 },
    credentialUrl: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false }
);

const ProjectItemSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    technologies: [{ type: String, trim: true, maxlength: 50 }],
    role: { type: String, trim: true, maxlength: 100 },
    duration: { type: String, trim: true, maxlength: 100 },
    githubUrl: { type: String, trim: true, maxlength: 300 },
    liveDemoUrl: { type: String, trim: true, maxlength: 300 },
    imageUrl: { type: String, trim: true, maxlength: 500 },
    visibility: { type: String, enum: ['PUBLIC', 'PRIVATE'], default: 'PUBLIC' },
    createdAt: { type: String },
    updatedAt: { type: String },
  },
  { _id: false }
);

const ExperienceItemSchema = new Schema(
  {
    id: { type: String },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    company: { type: String, required: true, trim: true, maxlength: 120 },
    location: { type: String, trim: true, maxlength: 100 },
    startDate: { type: String, trim: true },
    endDate: { type: String, trim: true },
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 2000 },
  },
  { _id: false }
);

const AchievementItemSchema = new Schema(
  {
    id: { type: String },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    date: { type: String, trim: true },
    issuer: { type: String, trim: true, maxlength: 150 },
  },
  { _id: false }
);

const ExtracurricularItemSchema = new Schema(
  {
    id: { type: String },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    role: { type: String, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000 },
    year: { type: Number, min: 1980, max: 2040 },
  },
  { _id: false }
);

const StudentProfileSchema = new Schema<StudentProfileData>(
  {
    educationLevel: { type: String, trim: true, maxlength: 50 },
    collegeName: { type: String, trim: true, maxlength: 120 },
    course: { type: String, trim: true, maxlength: 100 },
    graduationYear: { type: Number, min: 1980, max: 2040 },
    cgpa: { type: Number, min: 0, max: 10 },
    backlogs: { type: Number, min: 0, max: 20 },
    skills: [{ type: String, trim: true, maxlength: 40 }],
    careerInterests: [{ type: String, trim: true, maxlength: 60 }],
    preferredWorkLocation: [{ type: String, trim: true, maxlength: 60 }],
    profileCompletionScore: { type: Number, default: 0, min: 0, max: 100 },
    // Phase 5 extensions
    headline: { type: String, trim: true, maxlength: 150 },
    careerObjective: { type: String, trim: true, maxlength: 1500 },
    specialization: { type: String, trim: true, maxlength: 100 },
    technicalSkills: [{ type: String, trim: true, maxlength: 50 }],
    softSkills: [{ type: String, trim: true, maxlength: 50 }],
    educationHistory: [EducationItemSchema],
    certifications: [CertificationItemSchema],
    projects: [ProjectItemSchema],
    internships: [ExperienceItemSchema],
    workExperience: [ExperienceItemSchema],
    achievements: [AchievementItemSchema],
    extracurriculars: [ExtracurricularItemSchema],
    githubUrl: { type: String, trim: true, maxlength: 300 },
    linkedinUrl: { type: String, trim: true, maxlength: 300 },
    portfolioUrl: { type: String, trim: true, maxlength: 300 },
    preferredJobRoles: [{ type: String, trim: true, maxlength: 80 }],
    preferredWorkLocations: [{ type: String, trim: true, maxlength: 80 }],
    workModePreference: {
      type: String,
      enum: ['ONSITE', 'REMOTE', 'HYBRID', 'ANY'],
      default: 'ANY',
    },
    // Phase 10 WhatsApp preferences
    whatsappNumber: { type: String, trim: true, maxlength: 25 },
    whatsappVerified: { type: Boolean, default: false },
    whatsappLinkedAt: { type: String },
    whatsappNotificationsEnabled: { type: Boolean, default: true },
    whatsappJobAlertsEnabled: { type: Boolean, default: true },
    whatsappApplicationUpdatesEnabled: { type: Boolean, default: true },
    whatsappInterviewAlertsEnabled: { type: Boolean, default: true },
    whatsappCareerTipsEnabled: { type: Boolean, default: true },
    whatsappConsentAt: { type: String },
    whatsappConsentSource: { type: String },
    whatsappOptOutAt: { type: String },
  },
  { _id: false }
);

const EmployerProfileSchema = new Schema<EmployerProfileData>(
  {
    organizationName: { type: String, trim: true, maxlength: 120 },
    industry: { type: String, trim: true, maxlength: 80 },
    organizationLocation: { type: String, trim: true, maxlength: 100 },
    organizationDescription: { type: String, trim: true, maxlength: 1000 },
    hiringInterests: [{ type: String, trim: true, maxlength: 60 }],
  },
  { _id: false }
);

const CollegeProfileSchema = new Schema<CollegeProfileData>(
  {
    institutionName: { type: String, trim: true, maxlength: 150 },
    institutionLocation: { type: String, trim: true, maxlength: 100 },
    institutionType: { type: String, trim: true, maxlength: 60 },
    contactPerson: { type: String, trim: true, maxlength: 100 },
    placementEmail: { type: String, trim: true, lowercase: true, maxlength: 100 },
    placementPhone: { type: String, trim: true, maxlength: 20 },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: String },
    verifiedBy: { type: String },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
      maxlength: [120, 'Email cannot exceed 120 characters'],
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Do not return passwordHash in standard queries
    },
    role: {
      type: String,
      required: [true, 'Account role is required'],
      enum: {
        values: ['STUDENT', 'EMPLOYER', 'COLLEGE', 'ADMIN', 'MENTOR'],
        message: 'Role must be STUDENT, EMPLOYER, COLLEGE, ADMIN, or MENTOR',
      },
      index: true,
    },
    preferredLanguage: {
      type: String,
      default: 'en',
      trim: true,
      maxlength: [10, 'Language code cannot exceed 10 characters'],
    },
    phoneNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
      default: undefined,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspensionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Suspension reason cannot exceed 500 characters'],
    },
    suspendedAt: {
      type: Date,
    },
    suspendedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    studentProfile: {
      type: StudentProfileSchema,
      default: undefined,
    },
    employerProfile: {
      type: EmployerProfileSchema,
      default: undefined,
    },
    collegeProfile: {
      type: CollegeProfileSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.calculateStudentScore = function (this: IUser): number {
  if (this.role !== 'STUDENT') return 0;
  const sp = this.studentProfile;
  if (!sp) return 0;

  let score = 0;
  if (sp.collegeName && sp.collegeName.trim().length > 0) score += 15;
  if (sp.course && sp.course.trim().length > 0) score += 15;
  if (sp.educationLevel && sp.educationLevel.trim().length > 0) score += 10;
  if (sp.graduationYear && sp.graduationYear >= 1980) score += 10;
  if (sp.skills && sp.skills.length > 0) score += 20;
  if (sp.careerInterests && sp.careerInterests.length > 0) score += 15;
  if (sp.preferredWorkLocation && sp.preferredWorkLocation.length > 0) score += 15;

  return Math.min(100, Math.max(0, score));
};

UserSchema.methods.toSafeObject = function (this: IUser): SafeUser {
  return {
    id: (this._id as string | mongoose.Types.ObjectId).toString(),
    fullName: this.fullName,
    email: this.email,
    role: this.role,
    preferredLanguage: this.preferredLanguage,
    phoneNumber: this.phoneNumber,
    isActive: this.isActive,
    isSuspended: Boolean(this.isSuspended),
    suspensionReason: this.suspensionReason,
    suspendedAt: this.suspendedAt ? this.suspendedAt.toISOString() : undefined,
    suspendedBy: this.suspendedBy ? this.suspendedBy.toString() : undefined,
    studentProfile: this.studentProfile,
    employerProfile: this.employerProfile,
    collegeProfile: this.collegeProfile,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
