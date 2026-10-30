import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  EmployerCompanyProfileData,
  CompanyPublicProfileData,
  VerificationStatus,
} from '../types/index.js';

export interface IEmployerProfile extends Document {
  userId: Types.ObjectId;
  companyName: string;
  companyDescription: string;
  companyWebsite?: string;
  industry: string;
  companySize?: string;
  headquarters: string;
  companyLogo?: string;
  contactPerson: string;
  designation: string;
  verified: boolean;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): EmployerCompanyProfileData;
  toPublicObject(): CompanyPublicProfileData;
}

const EmployerProfileSchema = new Schema<IEmployerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for employer profile'],
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: [2, 'Company name must be at least 2 characters'],
      maxlength: [120, 'Company name cannot exceed 120 characters'],
      index: true,
    },
    companyDescription: {
      type: String,
      required: [true, 'Company description is required'],
      trim: true,
      maxlength: [3000, 'Company description cannot exceed 3000 characters'],
    },
    companyWebsite: {
      type: String,
      trim: true,
      maxlength: [200, 'Company website cannot exceed 200 characters'],
    },
    industry: {
      type: String,
      required: [true, 'Industry sector is required'],
      trim: true,
      maxlength: [100, 'Industry name cannot exceed 100 characters'],
      index: true,
    },
    companySize: {
      type: String,
      trim: true,
      default: '11-50',
    },
    headquarters: {
      type: String,
      required: [true, 'Headquarters location is required'],
      trim: true,
      maxlength: [120, 'Headquarters location cannot exceed 120 characters'],
    },
    companyLogo: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
      maxlength: [100, 'Contact person cannot exceed 100 characters'],
    },
    designation: {
      type: String,
      required: [true, 'Designation / job title is required'],
      trim: true,
      maxlength: [100, 'Designation cannot exceed 100 characters'],
    },
    verified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: {
        values: ['PENDING', 'VERIFIED', 'REJECTED'],
        message: 'Verification status must be PENDING, VERIFIED, or REJECTED',
      },
      default: 'PENDING',
      index: true,
    },
    verificationNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Verification notes cannot exceed 500 characters'],
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

EmployerProfileSchema.methods.toSafeObject = function (this: IEmployerProfile): EmployerCompanyProfileData {
  return {
    id: (this._id as Types.ObjectId).toString(),
    userId: this.userId.toString(),
    companyName: this.companyName,
    companyDescription: this.companyDescription,
    companyWebsite: this.companyWebsite,
    industry: this.industry,
    companySize: this.companySize,
    headquarters: this.headquarters,
    companyLogo: this.companyLogo,
    contactPerson: this.contactPerson,
    designation: this.designation,
    verified: this.verified,
    verificationStatus: this.verificationStatus,
    verificationNotes: this.verificationNotes,
    verifiedBy: this.verifiedBy ? this.verifiedBy.toString() : undefined,
    verifiedAt: this.verifiedAt ? this.verifiedAt.toISOString() : undefined,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

EmployerProfileSchema.methods.toPublicObject = function (this: IEmployerProfile): CompanyPublicProfileData {
  return {
    id: (this._id as Types.ObjectId).toString(),
    userId: this.userId.toString(),
    companyName: this.companyName,
    companyDescription: this.companyDescription,
    companyWebsite: this.companyWebsite,
    industry: this.industry,
    companySize: this.companySize,
    headquarters: this.headquarters,
    companyLogo: this.companyLogo,
    verified: this.verified,
    verificationStatus: this.verificationStatus,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

export const EmployerProfile: Model<IEmployerProfile> = mongoose.model<IEmployerProfile>(
  'EmployerProfile',
  EmployerProfileSchema
);
