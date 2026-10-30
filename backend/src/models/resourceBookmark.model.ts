import mongoose, { Schema, Document, Model } from 'mongoose';
import { ResourceBookmarkData } from '../types/index.js';

export interface IResourceBookmark extends Document {
  bookmarkId: string;
  studentId: string;
  resourceId: string;
  personalNote?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): ResourceBookmarkData;
}

const ResourceBookmarkSchema = new Schema<IResourceBookmark>(
  {
    bookmarkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      index: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    personalNote: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
    },
  },
  {
    timestamps: true,
  }
);

ResourceBookmarkSchema.index(
  { studentId: 1, resourceId: 1 },
  { unique: true }
);

ResourceBookmarkSchema.methods.toSafeObject = function (
  this: IResourceBookmark
): ResourceBookmarkData {
  return {
    id: this.bookmarkId || (this._id as string | mongoose.Types.ObjectId).toString(),
    studentId: this.studentId,
    resourceId: this.resourceId,
    personalNote: this.personalNote || '',
    category: this.category || 'General',
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const ResourceBookmark: Model<IResourceBookmark> =
  mongoose.models.ResourceBookmark ||
  mongoose.model<IResourceBookmark>('ResourceBookmark', ResourceBookmarkSchema);
