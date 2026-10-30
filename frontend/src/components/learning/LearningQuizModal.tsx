import React, { useState, useEffect } from 'react';
import {
  X,
  HelpCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Award,
  ChevronRight,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  LearningQuizData,
  LearningQuizAttemptData,
} from '../../types';
import {
  fetchLearningQuizApi,
  submitLearningQuizApi,
} from '../../services/api';

interface LearningQuizModalProps {
  quizId: string;
  learningPathId?: string;
  token?: string | null;
  onClose: () => void;
  onQuizPassed?: (score: number) => void;
}

export const LearningQuizModal: React.FC<LearningQuizModalProps> = ({
  quizId,
  learningPathId,
  token,
  onClose,
  onQuizPassed,
}) => {
  const [quiz, setQuiz] = useState<LearningQuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [attemptResult, setAttemptResult] = useState<LearningQuizAttemptData | null>(null);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchLearningQuizApi(quizId, token);
      if (res.success && res.data) {
        setQuiz(res.data);
      } else {
        setError(res.error?.message || 'Failed to load quiz');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (attemptResult) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < quiz.questions.length) {
      if (!window.confirm(`You answered ${answeredCount} of ${quiz.questions.length} questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await submitLearningQuizApi(
        quizId,
        selectedAnswers,
        learningPathId,
        token
      );
      if (res.success && res.data) {
        setAttemptResult(res.data);
        if (res.data.passed && onQuizPassed) {
          onQuizPassed(res.data.score);
        }
      } else {
        setError(res.error?.message || 'Failed to grade quiz');
      }
    } catch (err: any) {
      setError(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setAttemptResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {quiz?.title || 'Knowledge Check'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {quiz ? `${quiz.skill} • Passing score: ${quiz.passingScore}%` : 'Evaluating understanding'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Loading knowledge check questions...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quiz Result Banner */}
          {attemptResult && (
            <div
              className={`p-5 rounded-2xl border ${
                attemptResult.passed
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {attemptResult.passed ? (
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <CheckCircle className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-bold">
                      {attemptResult.passed ? 'Knowledge Check Passed!' : 'Need a Bit More Practice'}
                    </h4>
                    <p className="text-sm opacity-90">
                      Score: <span className="font-bold">{attemptResult.score}%</span> (
                      {attemptResult.correctCount} of {attemptResult.totalQuestions} correct)
                    </p>
                  </div>
                </div>

                {!attemptResult.passed && (
                  <button
                    onClick={handleRetake}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm flex items-center gap-2 transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retake Quiz
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Questions List */}
          {quiz && !loading && (
            <div className="space-y-6">
              {quiz.questions.map((question, qIdx) => {
                const evalData = attemptResult?.evaluations?.find(
                  (e) => e.questionId === question.id
                );

                return (
                  <div
                    key={question.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                        {qIdx + 1}
                      </span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white flex-1 leading-relaxed">
                        {question.questionText}
                      </p>
                    </div>

                    {/* Options */}
                    <div className="space-y-2.5 pt-1">
                      {question.options.map((option) => {
                        const isSelected = selectedAnswers[question.id] === option.id;
                        let optionStyle =
                          'border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200';

                        if (isSelected) {
                          optionStyle =
                            'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium ring-1 ring-indigo-600';
                        }

                        if (evalData) {
                          if (option.id === evalData.correctOptionId) {
                            optionStyle =
                              'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500';
                          } else if (isSelected && !evalData.isCorrect) {
                            optionStyle =
                              'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500';
                          }
                        }

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelectOption(question.id, option.id)}
                            disabled={Boolean(attemptResult)}
                            className={`w-full text-left p-3.5 rounded-xl border text-sm transition flex items-center justify-between ${optionStyle}`}
                          >
                            <span>{option.text}</span>
                            {isSelected && !evalData && (
                              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                            )}
                            {evalData && option.id === evalData.correctOptionId && (
                              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            )}
                            {evalData && isSelected && !evalData.isCorrect && (
                              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Server Explanation if graded */}
                    {evalData && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border-l-4 border-indigo-500">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
                          Explanation:
                        </span>
                        {evalData.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="text-xs text-slate-500">
            {quiz && !attemptResult && (
              <span>
                {Object.keys(selectedAnswers).length} of {quiz.questions.length} answered
              </span>
            )}
            {attemptResult && <span>Evaluated securely on server</span>}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-medium transition"
            >
              {attemptResult ? 'Close' : 'Cancel'}
            </button>

            {!attemptResult && (
              <button
                onClick={handleSubmit}
                disabled={submitting || loading || Object.keys(selectedAnswers).length === 0}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Grading...
                  </>
                ) : (
                  <>
                    Submit Answers
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
