import mongoose, { Schema, Document, Model } from 'mongoose';
import { MentorshipMessageData } from '../types/index.js';

export interface IMentorshipMessage extends Document {
  relationshipId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(extra?: { senderName?: string }): MentorshipMessageData;
}

const MentorshipMessageSchema = new Schema<IMentorshipMessage>(
  {
    relationshipId: {
      type: Schema.Types.ObjectId,
      ref: 'MentorshipRelationship',
      required: [true, 'Relationship ID is required'],
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver ID is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      trim: true,
      maxlength: 3000,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

MentorshipMessageSchema.methods.toSafeObject = function (extra?: { senderName?: string }): MentorshipMessageData {
  return {
    id: this._id ? this._id.toString() : '',
    relationshipId: this.relationshipId ? this.relationshipId.toString() : '',
    senderId: this.senderId ? this.senderId.toString() : '',
    senderName: extra?.senderName,
    receiverId: this.receiverId ? this.receiverId.toString() : '',
    content: this.content,
    readAt: this.readAt ? this.readAt.toISOString() : undefined,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

export const MentorshipMessage: Model<IMentorshipMessage> =
  mongoose.models.MentorshipMessage ||
  mongoose.model<IMentorshipMessage>('MentorshipMessage', MentorshipMessageSchema);
