import mongoose, { Schema, Document, Model } from 'mongoose';
import { MentorshipFeedbackData } from '../types/index.js';

export interface IMentorshipFeedback extends Document {
  relationshipId: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  submittedBy: mongoose.Types.ObjectId;
  targetUserId: mongoose.Types.ObjectId;
  role: 'STUDENT' | 'MENTOR';
  rating: number;
  writtenFeedback: string;
  strengthsHighlight: string[];
  areasToImprove: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): MentorshipFeedbackData;
}

const MentorshipFeedbackSchema = new Schema<IMentorshipFeedback>(
  {
    relationshipId: {
      type: Schema.Types.ObjectId,
      ref: 'MentorshipRelationship',
      required: [true, 'Relationship ID is required'],
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'MentorshipSession',
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitter ID is required'],
      index: true,
    },
    targetUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Target User ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['STUDENT', 'MENTOR'],
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    writtenFeedback: {
      type: String,
      required: [true, 'Written feedback is required'],
      trim: true,
      maxlength: 2000,
    },
    strengthsHighlight: {
      type: [String],
      default: [],
    },
    areasToImprove: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MentorshipFeedbackSchema.methods.toSafeObject = function (): MentorshipFeedbackData {
  return {
    id: this._id ? this._id.toString() : '',
    relationshipId: this.relationshipId ? this.relationshipId.toString() : '',
    sessionId: this.sessionId ? this.sessionId.toString() : undefined,
    submittedBy: this.submittedBy ? this.submittedBy.toString() : '',
    targetUserId: this.targetUserId ? this.targetUserId.toString() : '',
    role: this.role,
    rating: this.rating,
    writtenFeedback: this.writtenFeedback,
    strengthsHighlight: this.strengthsHighlight || [],
    areasToImprove: this.areasToImprove || [],
    isPublic: Boolean(this.isPublic),
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

export const MentorshipFeedback: Model<IMentorshipFeedback> =
  mongoose.models.MentorshipFeedback ||
  mongoose.model<IMentorshipFeedback>('MentorshipFeedback', MentorshipFeedbackSchema);
