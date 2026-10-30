import mongoose, { Schema, Document, Model } from 'mongoose';
import { LearningCategoryData } from '../types/index.js';

export interface ILearningCategory extends Document {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): LearningCategoryData;
}

const LearningCategorySchema = new Schema<ILearningCategory>(
  {
    categoryId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'BookOpen',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

LearningCategorySchema.methods.toSafeObject = function (
  this: ILearningCategory
): LearningCategoryData {
  return {
    id: this.categoryId || (this._id as string | mongoose.Types.ObjectId).toString(),
    name: this.name,
    slug: this.slug,
    description: this.description,
    icon: this.icon,
    isActive: this.isActive,
    order: this.order,
  };
};

export const LearningCategory: Model<ILearningCategory> =
  mongoose.models.LearningCategory ||
  mongoose.model<ILearningCategory>('LearningCategory', LearningCategorySchema);
