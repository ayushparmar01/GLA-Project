import mongoose, { Schema, Document, Model } from 'mongoose';
import { MentorshipGoalData, MentorshipGoalStatus } from '../types/index.js';

export interface IMentorshipGoal extends Document {
  relationshipId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  mentorId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  targetDate?: Date;
  progress: number;
  status: MentorshipGoalStatus;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): MentorshipGoalData;
}

const MentorshipGoalSchema = new Schema<IMentorshipGoal>(
  {
    relationshipId: {
      type: Schema.Types.ObjectId,
      ref: 'MentorshipRelationship',
      required: [true, 'Relationship ID is required'],
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Mentor ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1500,
    },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
    },
    targetDate: {
      type: Date,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MentorshipGoalSchema.methods.toSafeObject = function (): MentorshipGoalData {
  return {
    id: this._id ? this._id.toString() : '',
    relationshipId: this.relationshipId ? this.relationshipId.toString() : '',
    studentId: this.studentId ? this.studentId.toString() : '',
    mentorId: this.mentorId ? this.mentorId.toString() : '',
    title: this.title,
    description: this.description || '',
    priority: this.priority || 'MEDIUM',
    targetDate: this.targetDate ? this.targetDate.toISOString() : undefined,
    progress: this.progress || 0,
    status: this.status,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const MentorshipGoal: Model<IMentorshipGoal> =
  mongoose.models.MentorshipGoal || mongoose.model<IMentorshipGoal>('MentorshipGoal', MentorshipGoalSchema);
