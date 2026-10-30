import mongoose, { Schema, Document, Model } from 'mongoose';
import { SkillData, SkillCategory, SkillDifficulty } from '../types/index.js';

export interface ISkill extends Document {
  skillId: string;
  name: string;
  category: SkillCategory;
  description: string;
  relatedSkills: string[];
  difficultyLevel: SkillDifficulty;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): SkillData;
}

const SkillSchema = new Schema<ISkill>(
  {
    skillId: {
      type: String,
      required: [true, 'Skill slug identifier is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Programming Languages',
        'Data Structures and Algorithms',
        'Web Development',
        'Databases',
        'Cloud Computing',
        'AI and Machine Learning',
        'Cybersecurity',
        'Software Engineering',
        'Communication',
        'Problem Solving',
      ],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    relatedSkills: {
      type: [String],
      default: [],
    },
    difficultyLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

SkillSchema.methods.toSafeObject = function (this: ISkill): SkillData {
  return {
    id: this.skillId || (this._id as string | mongoose.Types.ObjectId).toString(),
    name: this.name,
    category: this.category,
    description: this.description,
    relatedSkills: this.relatedSkills || [],
    difficultyLevel: this.difficultyLevel,
    isActive: this.isActive,
  };
};

export const Skill: Model<ISkill> =
  mongoose.models.Skill || mongoose.model<ISkill>('Skill', SkillSchema);
