import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { PlacementDriveData, OpportunityType, WorkMode, DriveStatus } from '../types/index.js';

export interface IPlacementDrive extends Document {
  title: string;
  description: string;
  collegeId: Types.ObjectId;
  createdBy: Types.ObjectId;
  organizationName: string;
  opportunityType: OpportunityType;
  workMode: WorkMode;
  location?: string;
  eligibleCourses?: string[];
  eligibleGraduationYears?: number[];
  requiredSkills?: string[];
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
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owning college ID is required'],
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
        values: ['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED'],
        message: 'Status must be DRAFT, PUBLISHED, CLOSED, or CANCELLED',
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

PlacementDriveSchema.methods.toSafeObject = function (this: IPlacementDrive, applicationCount?: number): PlacementDriveData {
  return {
    id: (this._id as Types.ObjectId).toString(),
    title: this.title,
    description: this.description,
    collegeId: this.collegeId.toString(),
    createdBy: this.createdBy.toString(),
    organizationName: this.organizationName,
    opportunityType: this.opportunityType,
    workMode: this.workMode,
    location: this.location,
    eligibleCourses: this.eligibleCourses || [],
    eligibleGraduationYears: this.eligibleGraduationYears || [],
    requiredSkills: this.requiredSkills || [],
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
