import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  AssessmentData,
  AssessmentQuestion,
  QuestionOption,
  SkillCategory,
  SkillDifficulty,
  QuestionType,
} from '../types/index.js';

export interface IAssessmentQuestion {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  codeSnippet?: string;
  options: QuestionOption[];
  correctAnswers: string[];
  marks: number;
  negativeMarks?: number;
  explanation?: string;
  skill?: string;
}

export interface IAssessment extends Document {
  assessmentId: string;
  title: string;
  description: string;
  category: SkillCategory;
  skillsTested: string[];
  difficulty: SkillDifficulty;
  durationMinutes: number;
  totalMarks: number;
  passingPercentage: number;
  isActive: boolean;
  questions: IAssessmentQuestion[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): AssessmentData;
  toDetailedObject(): AssessmentData;
}

const QuestionOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const AssessmentQuestionSchema = new Schema(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      required: true,
      enum: ['MCQ', 'MULTIPLE_SELECT', 'OUTPUT_PREDICTION', 'DEBUGGING', 'CONCEPTUAL'],
    },
    codeSnippet: { type: String },
    options: { type: [QuestionOptionSchema], default: [] },
    correctAnswers: { type: [String], required: true },
    marks: { type: Number, required: true, min: 1 },
    negativeMarks: { type: Number, default: 0, min: 0 },
    explanation: { type: String },
    skill: { type: String },
  },
  { _id: false }
);

const AssessmentSchema = new Schema<IAssessment>(
  {
    assessmentId: {
      type: String,
      required: [true, 'Assessment ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
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
    skillsTested: {
      type: [String],
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 5,
      max: 180,
      default: 30,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 0,
    },
    passingPercentage: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 60,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    questions: {
      type: [AssessmentQuestionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate totalMarks from questions if not set
AssessmentSchema.pre('save', function (next) {
  if (this.questions && this.questions.length > 0) {
    this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }
  next();
});

// Sanitized representation for test-takers: strips correctAnswers & explanation
AssessmentSchema.methods.toSafeObject = function (this: IAssessment): AssessmentData {
  const sanitizedQuestions: AssessmentQuestion[] = (this.questions || []).map((q) => ({
    id: q.questionId,
    questionText: q.questionText,
    questionType: q.questionType,
    codeSnippet: q.codeSnippet,
    options: q.options || [],
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    skill: q.skill,
    // explicitly omit correctAnswers and explanation
  }));

  return {
    id: this.assessmentId || (this._id as string | mongoose.Types.ObjectId).toString(),
    title: this.title,
    description: this.description,
    category: this.category,
    skillsTested: this.skillsTested || [],
    difficulty: this.difficulty,
    durationMinutes: this.durationMinutes,
    totalMarks: this.totalMarks,
    passingPercentage: this.passingPercentage,
    questionCount: this.questions ? this.questions.length : 0,
    questions: sanitizedQuestions,
    isActive: this.isActive,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

// Detailed representation including correct answers and explanation
AssessmentSchema.methods.toDetailedObject = function (this: IAssessment): AssessmentData {
  const questions: AssessmentQuestion[] = (this.questions || []).map((q) => ({
    id: q.questionId,
    questionText: q.questionText,
    questionType: q.questionType,
    codeSnippet: q.codeSnippet,
    options: q.options || [],
    correctAnswers: q.correctAnswers || [],
    marks: q.marks,
    negativeMarks: q.negativeMarks,
    explanation: q.explanation,
    skill: q.skill,
  }));

  return {
    id: this.assessmentId || (this._id as string | mongoose.Types.ObjectId).toString(),
    title: this.title,
    description: this.description,
    category: this.category,
    skillsTested: this.skillsTested || [],
    difficulty: this.difficulty,
    durationMinutes: this.durationMinutes,
    totalMarks: this.totalMarks,
    passingPercentage: this.passingPercentage,
    questionCount: this.questions ? this.questions.length : 0,
    questions,
    isActive: this.isActive,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const Assessment: Model<IAssessment> =
  mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', AssessmentSchema);
