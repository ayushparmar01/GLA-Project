import mongoose, { Schema, Document, Model } from 'mongoose';
import { AiConversationData, AiMessage, AiRole } from '../types/index.js';

export interface IAiConversation extends Document {
  studentId: mongoose.Types.ObjectId;
  title: string;
  messages: Array<{
    id: string;
    role: AiRole;
    content: string;
    isFallback?: boolean;
    provider?: string;
    fallbackReason?: string;
    timestamp: Date;
  }>;
  contextSnapshot?: {
    targetRole?: string;
    headline?: string;
    course?: string;
    verifiedSkills?: string[];
    readinessScore?: number;
  };
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): AiConversationData;
}

const AiMessageSchema = new Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    isFallback: { type: Boolean, default: false },
    provider: { type: String, default: 'DETERMINISTIC_FALLBACK' },
    fallbackReason: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AiConversationSchema = new Schema<IAiConversation>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Conversation title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    messages: {
      type: [AiMessageSchema],
      default: [],
    },
    contextSnapshot: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

AiConversationSchema.index({ studentId: 1, updatedAt: -1 });

AiConversationSchema.methods.toSafeObject = function (this: IAiConversation): AiConversationData {
  const safeMessages: AiMessage[] = (this.messages || []).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    isFallback: m.isFallback,
    provider: m.provider,
    fallbackReason: m.fallbackReason,
    timestamp: m.timestamp ? m.timestamp.toISOString() : new Date().toISOString(),
  }));

  return {
    id: (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId.toString(),
    title: this.title,
    messages: safeMessages,
    contextSnapshot: this.contextSnapshot,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const AiConversation: Model<IAiConversation> =
  mongoose.models.AiConversation ||
  mongoose.model<IAiConversation>('AiConversation', AiConversationSchema);
