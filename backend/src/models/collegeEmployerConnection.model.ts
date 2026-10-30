import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { CollegeEmployerConnectionData, ConnectionStatus } from '../types/index.js';

export interface ICollegeEmployerConnection extends Document {
  collegeId: Types.ObjectId;
  employerId: Types.ObjectId;
  initiatedBy: 'EMPLOYER' | 'COLLEGE';
  message?: string;
  status: ConnectionStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(collegeName?: string, companyName?: string): CollegeEmployerConnectionData;
}

const CollegeEmployerConnectionSchema = new Schema<ICollegeEmployerConnection>(
  {
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'College ID is required'],
      index: true,
    },
    employerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employer ID is required'],
      index: true,
    },
    initiatedBy: {
      type: String,
      enum: ['EMPLOYER', 'COLLEGE'],
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: [1000, 'Connection message cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index prevents duplicate connection records between the same college and employer
CollegeEmployerConnectionSchema.index({ collegeId: 1, employerId: 1 }, { unique: true });

CollegeEmployerConnectionSchema.methods.toSafeObject = function (
  this: ICollegeEmployerConnection,
  collegeName?: string,
  companyName?: string
): CollegeEmployerConnectionData {
  return {
    id: (this._id as Types.ObjectId).toString(),
    collegeId: this.collegeId.toString(),
    employerId: this.employerId.toString(),
    initiatedBy: this.initiatedBy,
    message: this.message,
    status: this.status,
    reviewedBy: this.reviewedBy ? this.reviewedBy.toString() : undefined,
    reviewedAt: this.reviewedAt ? this.reviewedAt.toISOString() : undefined,
    collegeName,
    companyName,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const CollegeEmployerConnection: Model<ICollegeEmployerConnection> = mongoose.model<ICollegeEmployerConnection>(
  'CollegeEmployerConnection',
  CollegeEmployerConnectionSchema
);
