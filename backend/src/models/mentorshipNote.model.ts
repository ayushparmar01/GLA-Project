import mongoose, { Schema, Document, Model } from 'mongoose';
import { MentorshipNoteData, NoteVisibility } from '../types/index.js';

export interface IMentorshipNote extends Document {
  relationshipId: mongoose.Types.ObjectId;
  sessionId?: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  visibility: NoteVisibility;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(extra?: { authorName?: string }): MentorshipNoteData;
}

const MentorshipNoteSchema = new Schema<IMentorshipNote>(
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
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author ID is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Note content is required'],
      trim: true,
      maxlength: 5000,
    },
    visibility: {
      type: String,
      enum: ['PRIVATE', 'SHARED'],
      default: 'PRIVATE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MentorshipNoteSchema.methods.toSafeObject = function (extra?: { authorName?: string }): MentorshipNoteData {
  return {
    id: this._id ? this._id.toString() : '',
    relationshipId: this.relationshipId ? this.relationshipId.toString() : '',
    sessionId: this.sessionId ? this.sessionId.toString() : undefined,
    authorId: this.authorId ? this.authorId.toString() : '',
    authorName: extra?.authorName,
    content: this.content,
    visibility: this.visibility,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const MentorshipNote: Model<IMentorshipNote> =
  mongoose.models.MentorshipNote || mongoose.model<IMentorshipNote>('MentorshipNote', MentorshipNoteSchema);
