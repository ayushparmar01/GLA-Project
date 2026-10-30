import React, { useState, useEffect } from 'react';
import {
  fetchInterviewQuestionsApi,
  evaluateInterviewAnswerApi,
} from '../../services/api';
import {
  InterviewPracticeQuestion,
  InterviewFeedbackReport,
  InterviewTypeCategory,
} from '../../types';
import {
  HelpCircle,
  Send,
  Sparkles,
  Award,
  AlertCircle,
  CheckCircle2,
  ThumbsUp,
  TrendingUp,
  BookOpen,
  Info,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface InterviewPreparationViewProps {
  token: string | null;
}

export const InterviewPreparationView: React.FC<InterviewPreparationViewProps> = ({ token }) => {
  const [questions, setQuestions] = useState<InterviewPracticeQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewPracticeQuestion | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [studentAnswer, setStudentAnswer] = useState<string>('');
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<InterviewFeedbackReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [selectedCategory]);

  const loadQuestions = async () => {
    setLoadingQuestions(true);
    setErrorMessage(null);
    try {
      const catParam = selectedCategory !== 'ALL' ? selectedCategory : undefined;
      const res = await fetchInterviewQuestionsApi(undefined, catParam, token);
      if (res.success && res.data) {
        setQuestions(res.data);
        if (res.data.length > 0 && !selectedQuestion) {
          setSelectedQuestion(res.data[0]);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load interview practice questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleSelectQuestion = (q: InterviewPracticeQuestion) => {
    setSelectedQuestion(q);
    setFeedback(null);
    setStudentAnswer('');
    setErrorMessage(null);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedQuestion || !studentAnswer.trim() || evaluating) return;

    setEvaluating(true);
    setErrorMessage(null);

    try {
      const res = await evaluateInterviewAnswerApi(
        selectedQuestion.id,
        studentAnswer.trim(),
        token
      );

      if (res.success && res.data) {
        setFeedback(res.data);
      } else {
        setErrorMessage(res.error?.message || 'Failed to evaluate answer');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error evaluating interview response');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/50 via-slate-900 to-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
            Campus Placement Prep
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Technical & HR Rounds
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Mock Interview Preparation & Evaluation
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
          Practice answering real-world technical and behavioral interview questions asked by hiring teams in Indian engineering and degree placement drives.
        </p>
      </div>

      {/* Advisory Legal Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-semibold text-amber-200">Advisory Notice:</span> CareerBridge mock interview evaluations provide objective feedback on your written technical concepts and answer completeness. We strictly do not record, evaluate, or score facial expressions, video, or voice pitch.
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Practice Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Question Picker */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          {/* Category Tabs */}
          <div className="flex gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            {['ALL', 'TECHNICAL', 'BEHAVIORAL', 'HR'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Questions ({questions.length})
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {loadingQuestions ? (
              <div className="text-center py-8 text-slate-500 text-xs">Loading questions...</div>
            ) : (
              questions.map((q) => {
                const isSelected = selectedQuestion?.id === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'bg-slate-800 border-indigo-500/50 text-white font-medium shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-400">
                        {q.category}
                      </span>
                      <span className="text-[10px] text-slate-500">{q.difficulty}</span>
                    </div>
                    <p className="line-clamp-2 text-xs font-medium">{q.questionText}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">Role: {q.role}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Question Workspace & Feedback */}
        <div className="lg:col-span-2 space-y-5">
          {selectedQuestion ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wide">
                    {selectedQuestion.category} Round
                  </span>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Role: {selectedQuestion.role}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    Difficulty: {selectedQuestion.difficulty}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {selectedQuestion.questionText}
                </h3>

                {selectedQuestion.context && (
                  <p className="text-xs text-slate-400 mt-1.5 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    Context: {selectedQuestion.context}
                  </p>
                )}
              </div>

              {/* Sample answer expectations hints */}
              {selectedQuestion.sampleAnswerGuidelines && (
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Recruiter expects coverage of:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {selectedQuestion.sampleAnswerGuidelines.map((g, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Student Answer Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Your Answer:
                </label>
                <textarea
                  value={studentAnswer}
                  onChange={(e) => setStudentAnswer(e.target.value)}
                  placeholder="Draft your answer here clearly and concisely as you would explain it to the interviewer..."
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-4 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none resize-y"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!studentAnswer.trim() || evaluating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs sm:text-sm transition-all shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  {evaluating ? 'Analyzing Answer...' : 'Submit for Feedback'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 text-xs">
              Select a question to practice.
            </div>
          )}

          {/* Feedback Report Card */}
          {feedback && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-400" />
                  Evaluation Report
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Score:</span>
                  <span
                    className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${
                      feedback.score >= 80
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : feedback.score >= 60
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {feedback.score} / 100
                  </span>
                </div>
              </div>

              {/* Strengths */}
              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <ThumbsUp className="w-3.5 h-3.5" /> Strengths:
                  </p>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {feedback.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <TrendingUp className="w-3.5 h-3.5" /> Areas for Improvement:
                  </p>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {feedback.areasForImprovement.map((area, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Model Answer Guidelines */}
              {feedback.modelAnswerSnippet && (
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <p className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
                    <BookOpen className="w-3.5 h-3.5" /> Reference Model Concepts:
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {feedback.modelAnswerSnippet}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
