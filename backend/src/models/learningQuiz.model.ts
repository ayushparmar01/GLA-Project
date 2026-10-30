import mongoose, { Schema, Document, Model } from 'mongoose';
import { LearningQuizData, QuizQuestion } from '../types/index.js';

export interface ILearningQuizQuestion {
  id: string;
  questionText: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  explanation: string;
}

export interface ILearningQuiz extends Document {
  quizId: string;
  title: string;
  moduleId?: string;
  skill: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  passingScore: number;
  questions: ILearningQuizQuestion[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(includeAnswers?: boolean): LearningQuizData;
}

const LearningQuizSchema = new Schema<ILearningQuiz>(
  {
    quizId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    moduleId: {
      type: String,
      index: true,
    },
    skill: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
    },
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    questions: [
      {
        id: { type: String, required: true },
        questionText: { type: String, required: true },
        options: [
          {
            id: { type: String, required: true },
            text: { type: String, required: true },
          },
        ],
        correctOptionId: { type: String, required: true },
        explanation: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

LearningQuizSchema.methods.toSafeObject = function (
  this: ILearningQuiz,
  includeAnswers: boolean = false
): LearningQuizData {
  return {
    id: this.quizId || (this._id as string | mongoose.Types.ObjectId).toString(),
    title: this.title,
    moduleId: this.moduleId,
    skill: this.skill,
    difficulty: this.difficulty,
    passingScore: this.passingScore || 70,
    questionCount: this.questions ? this.questions.length : 0,
    questions: (this.questions || []).map((q) => {
      const sanitized: QuizQuestion = {
        id: q.id,
        questionText: q.questionText,
        options: (q.options || []).map((opt) => ({ id: opt.id, text: opt.text })),
      };
      if (includeAnswers) {
        sanitized.correctOptionId = q.correctOptionId;
        sanitized.explanation = q.explanation;
      }
      return sanitized;
    }),
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const LearningQuiz: Model<ILearningQuiz> =
  mongoose.models.LearningQuiz ||
  mongoose.model<ILearningQuiz>('LearningQuiz', LearningQuizSchema);
