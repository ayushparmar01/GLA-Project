import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { CohortData, CohortStatus } from '../types/index.js';

export interface ICohort extends Document {
  name: string;
  description?: string;
  collegeId: Types.ObjectId;
  academicYear?: string;
  course?: string;
  graduationYear?: number;
  status: CohortStatus;
  studentIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): CohortData;
}

const CohortSchema = new Schema<ICohort>(
  {
    name: {
      type: String,
      required: [true, 'Cohort name is required'],
      trim: true,
      minlength: [2, 'Cohort name must be at least 2 characters'],
      maxlength: [100, 'Cohort name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'College ID is required'],
      index: true,
    },
    academicYear: {
      type: String,
      trim: true,
      maxlength: [20, 'Academic year cannot exceed 20 characters'],
    },
    course: {
      type: String,
      trim: true,
      maxlength: [100, 'Course cannot exceed 100 characters'],
    },
    graduationYear: {
      type: Number,
      min: [1980, 'Graduation year must be 1980 or later'],
      max: [2040, 'Graduation year cannot exceed 2040'],
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'ARCHIVED'],
        message: 'Cohort status must be ACTIVE or ARCHIVED',
      },
      default: 'ACTIVE',
      index: true,
    },
    studentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

CohortSchema.methods.toSafeObject = function (this: ICohort): CohortData {
  return {
    id: (this._id as Types.ObjectId).toString(),
    name: this.name,
    description: this.description,
    collegeId: this.collegeId.toString(),
    academicYear: this.academicYear,
    course: this.course,
    graduationYear: this.graduationYear,
    status: this.status,
    studentCount: Array.isArray(this.studentIds) ? this.studentIds.length : 0,
    studentIds: Array.isArray(this.studentIds) ? this.studentIds.map((id) => id.toString()) : [],
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const Cohort: Model<ICohort> = mongoose.model<ICohort>('Cohort', CohortSchema);
