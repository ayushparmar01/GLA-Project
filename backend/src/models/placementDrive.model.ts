import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { PlacementDriveData, OpportunityType, WorkMode, DriveStatus } from '../types/index.js';

export interface IPlacementDrive extends Document {
  title: string;
  description: string;
  collegeId?: Types.ObjectId;
  employerId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  organizationName: string;
  opportunityType: OpportunityType;
  workMode: WorkMode;
  location?: string;
  eligibleCourses?: string[];
  eligibleBranches?: string[];
  eligibleGraduationYears?: number[];
  requiredSkills?: string[];
  preferredSkills?: string[];
  minimumQualification?: string;
  minimumCGPA?: number;
  maxBacklogsAllowed?: number;
  minExperienceYears?: number;
  salaryRange?: string;
  internshipDuration?: string;
  numberOfOpenings?: number;
  recruitmentProcess?: string[];
  applicationDeadline: Date;
  driveDate?: Date;
  status: DriveStatus;
  cohortIds?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(applicationCount?: number): PlacementDriveData;
}

const PlacementDriveSchema = new Schema<IPlacementDrive>(
  {
    title: {
      type: String,
      required: [true, 'Drive title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Drive description is required'],
      trim: true,
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user ID is required'],
    },
    organizationName: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [120, 'Organization name cannot exceed 120 characters'],
    },
    opportunityType: {
      type: String,
      enum: {
        values: ['JOB', 'INTERNSHIP', 'APPRENTICESHIP'],
        message: 'Opportunity type must be JOB, INTERNSHIP, or APPRENTICESHIP',
      },
      required: [true, 'Opportunity type is required'],
      index: true,
    },
    workMode: {
      type: String,
      enum: {
        values: ['ONSITE', 'REMOTE', 'HYBRID'],
        message: 'Work mode must be ONSITE, REMOTE, or HYBRID',
      },
      default: 'ONSITE',
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: 'Pan-India',
    },
    eligibleCourses: [
      {
        type: String,
        trim: true,
        maxlength: [100, 'Course name cannot exceed 100 characters'],
      },
    ],
    eligibleBranches: [
      {
        type: String,
        trim: true,
        maxlength: [100, 'Branch name cannot exceed 100 characters'],
      },
    ],
    eligibleGraduationYears: [
      {
        type: Number,
        min: 1980,
        max: 2040,
      },
    ],
    requiredSkills: [
      {
        type: String,
        trim: true,
        maxlength: [50, 'Skill name cannot exceed 50 characters'],
      },
    ],
    preferredSkills: [
      {
        type: String,
        trim: true,
        maxlength: [50, 'Skill name cannot exceed 50 characters'],
      },
    ],
    minimumQualification: {
      type: String,
      trim: true,
      maxlength: [100, 'Minimum qualification cannot exceed 100 characters'],
    },
    minimumCGPA: {
      type: Number,
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10'],
    },
    maxBacklogsAllowed: {
      type: Number,
      min: [0, 'Backlogs cannot be negative'],
      max: [20, 'Max backlogs cannot exceed 20'],
    },
    minExperienceYears: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      max: [30, 'Experience cannot exceed 30 years'],
      default: 0,
    },
    salaryRange: {
      type: String,
      trim: true,
      maxlength: [80, 'Salary range cannot exceed 80 characters'],
    },
    internshipDuration: {
      type: String,
      trim: true,
      maxlength: [80, 'Internship duration cannot exceed 80 characters'],
    },
    numberOfOpenings: {
      type: Number,
      min: [1, 'Number of openings must be at least 1'],
    },
    recruitmentProcess: [
      {
        type: String,
        trim: true,
        maxlength: [100, 'Process round description cannot exceed 100 characters'],
      },
    ],
    applicationDeadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
      index: true,
    },
    driveDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'CLOSED', 'CANCELLED'],
        message: 'Status must be DRAFT, PENDING_APPROVAL, PUBLISHED, CLOSED, or CANCELLED',
      },
      default: 'DRAFT',
      index: true,
    },
    cohortIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Cohort',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Preserved & extended indexes
PlacementDriveSchema.index({ employerId: 1, status: 1 });
PlacementDriveSchema.index({ collegeId: 1, status: 1 });
PlacementDriveSchema.index({ applicationDeadline: 1, status: 1 });

PlacementDriveSchema.methods.toSafeObject = function (
  this: IPlacementDrive,
  applicationCount?: number
): PlacementDriveData {
  return {
    id: (this._id as Types.ObjectId).toString(),
    title: this.title,
    description: this.description,
    collegeId: this.collegeId ? this.collegeId.toString() : undefined,
    employerId: this.employerId ? this.employerId.toString() : undefined,
    createdBy: this.createdBy.toString(),
    organizationName: this.organizationName,
    opportunityType: this.opportunityType,
    workMode: this.workMode,
    location: this.location,
    eligibleCourses: this.eligibleCourses || [],
    eligibleBranches: this.eligibleBranches || [],
    eligibleGraduationYears: this.eligibleGraduationYears || [],
    requiredSkills: this.requiredSkills || [],
    preferredSkills: this.preferredSkills || [],
    minimumQualification: this.minimumQualification,
    minimumCGPA: this.minimumCGPA,
    maxBacklogsAllowed: this.maxBacklogsAllowed,
    minExperienceYears: this.minExperienceYears,
    salaryRange: this.salaryRange,
    internshipDuration: this.internshipDuration,
    numberOfOpenings: this.numberOfOpenings,
    recruitmentProcess: this.recruitmentProcess || [],
    applicationDeadline: this.applicationDeadline ? this.applicationDeadline.toISOString() : '',
    driveDate: this.driveDate ? this.driveDate.toISOString() : undefined,
    status: this.status,
    cohortIds: Array.isArray(this.cohortIds) ? this.cohortIds.map((id) => id.toString()) : [],
    applicationCount,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const PlacementDrive: Model<IPlacementDrive> = mongoose.model<IPlacementDrive>('PlacementDrive', PlacementDriveSchema);
