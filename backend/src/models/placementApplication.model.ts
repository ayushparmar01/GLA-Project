import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { PlacementApplicationData, ApplicationStatus, ApplicationStatusHistoryItem, PlacementDriveData, SafeUser } from '../types/index.js';

export interface IPlacementApplication extends Document {
  driveId: Types.ObjectId;
  studentId: Types.ObjectId;
  collegeId: Types.ObjectId;
  status: ApplicationStatus;
  appliedAt: Date;
  statusHistory: Array<{
    fromStatus: ApplicationStatus;
    toStatus: ApplicationStatus;
    changedBy: Types.ObjectId;
    changedAt: Date;
    note?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(drive?: Partial<PlacementDriveData>, student?: Partial<SafeUser>): PlacementApplicationData;
}

const ApplicationStatusHistorySchema = new Schema(
  {
    fromStatus: {
      type: String,
      required: true,
    },
    toStatus: {
      type: String,
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 300,
    },
  },
  { _id: false }
);

const PlacementApplicationSchema = new Schema<IPlacementApplication>(
  {
    driveId: {
      type: Schema.Types.ObjectId,
      ref: 'PlacementDrive',
      required: [true, 'Drive ID is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'College ID is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED', 'WITHDRAWN'],
        message: 'Status must be APPLIED, SHORTLISTED, INTERVIEW_SCHEDULED, SELECTED, REJECTED, or WITHDRAWN',
      },
      default: 'APPLIED',
      index: true,
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    statusHistory: [ApplicationStatusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Compound unique index: A student can apply only once to a placement drive
PlacementApplicationSchema.index({ driveId: 1, studentId: 1 }, { unique: true });

PlacementApplicationSchema.methods.toSafeObject = function (
  this: IPlacementApplication,
  drive?: Partial<PlacementDriveData>,
  student?: Partial<SafeUser>
): PlacementApplicationData {
  return {
    id: (this._id as Types.ObjectId).toString(),
    driveId: this.driveId.toString(),
    studentId: this.studentId.toString(),
    collegeId: this.collegeId.toString(),
    status: this.status,
    appliedAt: this.appliedAt ? this.appliedAt.toISOString() : new Date().toISOString(),
    statusHistory: Array.isArray(this.statusHistory)
      ? this.statusHistory.map((h) => ({
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          changedBy: h.changedBy.toString(),
          changedAt: h.changedAt ? h.changedAt.toISOString() : new Date().toISOString(),
          note: h.note,
        }))
      : [],
    drive,
    student,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const PlacementApplication: Model<IPlacementApplication> = mongoose.model<IPlacementApplication>(
  'PlacementApplication',
  PlacementApplicationSchema
);
