import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  MockInterviewType,
  MockInterviewDifficulty,
  MockInterviewQuestionType,
  MockInterviewQuestionData,
} from '../types/index.js';

export interface IInterviewQuestionBank extends Document {
  questionText: string;
  category: MockInterviewType;
  topic: string;
  role: string;
  difficulty: MockInterviewDifficulty;
  questionType: MockInterviewQuestionType;
  expectedConcepts: string[];
  suggestedApproach: string;
  starterCode?: string;
  codeLanguage?: string;
  timeLimitSeconds?: number;
  sourceType: 'CURATED' | 'JOB_DESCRIPTION' | 'RESUME' | 'ADMIN';
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): MockInterviewQuestionData;
}

const InterviewQuestionBankSchema = new Schema<IInterviewQuestionBank>(
  {
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: ['TECHNICAL', 'HR', 'BEHAVIORAL', 'ROLE_SPECIFIC', 'JOB_SPECIFIC', 'RESUME_BASED'],
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      default: 'General Software Engineer',
      index: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
      index: true,
    },
    questionType: {
      type: String,
      required: true,
      enum: ['CONCEPTUAL', 'CODING', 'SCENARIO', 'BEHAVIORAL', 'DEBUGGING', 'PROJECT_EXPLANATION'],
      default: 'CONCEPTUAL',
    },
    expectedConcepts: [
      {
        type: String,
        trim: true,
      },
    ],
    suggestedApproach: {
      type: String,
      trim: true,
      default: '',
    },
    starterCode: {
      type: String,
    },
    codeLanguage: {
      type: String,
      trim: true,
    },
    timeLimitSeconds: {
      type: Number,
      default: 300,
    },
    sourceType: {
      type: String,
      enum: ['CURATED', 'JOB_DESCRIPTION', 'RESUME', 'ADMIN'],
      default: 'CURATED',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

InterviewQuestionBankSchema.index({ category: 1, difficulty: 1, isActive: 1 });
InterviewQuestionBankSchema.index({ topic: 1, isActive: 1 });

InterviewQuestionBankSchema.methods.toSafeObject = function (
  this: IInterviewQuestionBank
): MockInterviewQuestionData {
  return {
    id: (this._id as string | mongoose.Types.ObjectId).toString(),
    questionText: this.questionText,
    category: this.category,
    topic: this.topic,
    role: this.role,
    difficulty: this.difficulty,
    questionType: this.questionType,
    expectedConcepts: this.expectedConcepts || [],
    suggestedApproach: this.suggestedApproach,
    starterCode: this.starterCode,
    codeLanguage: this.codeLanguage,
    timeLimitSeconds: this.timeLimitSeconds,
    sourceType: this.sourceType,
  };
};

export const InterviewQuestionBank: Model<IInterviewQuestionBank> =
  mongoose.model<IInterviewQuestionBank>('InterviewQuestionBank', InterviewQuestionBankSchema);
