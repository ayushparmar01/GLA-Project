import React, { useState, useEffect, useRef } from 'react';
import {
  AssessmentData,
  AssessmentAttemptData,
  AssessmentQuestion,
} from '../../types';
import {
  saveAssessmentAnswersApi,
  submitAssessmentAttemptApi,
} from '../../services/api';

interface AssessmentAttemptViewProps {
  attempt: AssessmentAttemptData;
  assessment: AssessmentData;
  token?: string | null;
  onFinishAttempt: (completedAttempt: AssessmentAttemptData) => void;
  onExit: () => void;
}

export const AssessmentAttemptView: React.FC<AssessmentAttemptViewProps> = ({
  attempt,
  assessment,
  token,
  onFinishAttempt,
  onExit,
}) => {
  const questions: AssessmentQuestion[] =
    attempt.sanitizedQuestions && attempt.sanitizedQuestions.length > 0
      ? attempt.sanitizedQuestions
      : assessment.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({
    ...attempt.answers,
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer state (seconds remaining)
  const initialDurationSeconds =
    (attempt.durationMinutes || assessment.durationMinutes || 30) * 60;
  const startedAtMs = new Date(attempt.startedAt).getTime();
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
  const remainingInitial = Math.max(0, initialDurationSeconds - elapsedSeconds);

  const [timeLeft, setTimeLeft] = useState<number>(remainingInitial);
  const timerRef = useRef<any>(null);

  // Auto-submit when time expires
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAutoSubmit = async () => {
    alert('Assessment time has expired! Auto-submitting your answers now.');
    await executeSubmission();
  };

  const handleOptionToggle = (questionId: string, optionId: string, isMulti: boolean) => {
    const current = answers[questionId] || [];
    let updated: string[];

    if (isMulti) {
      if (current.includes(optionId)) {
        updated = current.filter((id) => id !== optionId);
      } else {
        updated = [...current, optionId];
      }
    } else {
      updated = [optionId];
    }

    const nextAnswers = { ...answers, [questionId]: updated };
    setAnswers(nextAnswers);

    // Debounced autosave
    triggerAutosave(nextAnswers);
  };

  const triggerAutosave = async (newAnswers: Record<string, string[]>) => {
    if (!token) return;
    setSaving(true);
    try {
      await saveAssessmentAnswersApi(assessment.id, attempt.id, newAnswers, token);
    } catch {
      // Ignore background save failure silently
    } finally {
      setSaving(false);
    }
  };

  const executeSubmission = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await submitAssessmentAttemptApi(assessment.id, attempt.id, answers, token);
      if (res.success && res.data) {
        onFinishAttempt(res.data);
      } else {
        setError(res.error?.message || 'Failed to submit assessment');
        setSubmitting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error submitting attempt');
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const isMultipleSelect = currentQ?.questionType === 'MULTIPLE_SELECT';
  const selectedForCurrent = currentQ ? answers[currentQ.id] || [] : [];

  const answeredCount = questions.filter((q) => answers[q.id] && answers[q.id].length > 0).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Test Header & Timer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sticky top-4 z-20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
              {assessment.category}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Question {currentIndex + 1} of {questions.length}
            </span>
            {saving && (
              <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Saving
              </span>
            )}
          </div>
          <h2 className="font-bold text-slate-900 text-base sm:text-lg">{assessment.title}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Dynamic Countdown Timer */}
          <div
            className={`px-4 py-2 rounded-xl flex items-center gap-2 font-mono font-bold text-sm border ${
              timeLeft < 300
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors whitespace-nowrap"
          >
            Submit Test
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Question Navigator */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-semibold text-slate-500 shrink-0 mr-1">Questions:</span>
        {questions.map((q, idx) => {
          const isAnswered = answers[q.id] && answers[q.id].length > 0;
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all shrink-0 ${
                isCurrent
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                  : isAnswered
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      {currentQ && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                {currentQ.questionType.replace('_', ' ')}
              </span>
              {currentQ.skill && (
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {currentQ.skill}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              <span>+{currentQ.marks} marks</span>
              {currentQ.negativeMarks ? (
                <span className="text-rose-600 ml-2">(-{currentQ.negativeMarks} for wrong)</span>
              ) : null}
            </div>
          </div>

          {/* Question Text */}
          <div className="text-slate-900 font-semibold text-base md:text-lg leading-relaxed">
            {currentQ.questionText}
          </div>

          {/* Code Snippet (if present) */}
          {currentQ.codeSnippet && (
            <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner">
              <div className="bg-slate-800/80 px-4 py-1.5 text-[11px] font-mono text-slate-400 border-b border-slate-700/50">
                Code Snippet
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre leading-relaxed">
                {currentQ.codeSnippet}
              </pre>
            </div>
          )}

          {/* Option Selector Instructions */}
          <div className="text-xs text-slate-500 font-medium italic">
            {isMultipleSelect
              ? 'Select all applicable options (multiple choices allowed):'
              : 'Select one option:'}
          </div>

          {/* Options List */}
          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = selectedForCurrent.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => handleOptionToggle(currentQ.id, opt.id, isMultipleSelect)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <div
                      className={`w-5 h-5 rounded-${
                        isMultipleSelect ? 'md' : 'full'
                      } border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-slate-800 font-medium leading-relaxed">
                    {opt.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 font-semibold text-xs rounded-xl transition-colors"
            >
              Previous Question
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
              >
                Review & Submit
              </button>
            )}
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Submit Assessment?</h3>
              <p className="text-sm text-slate-600 mt-1">
                You have answered <strong>{answeredCount}</strong> of{' '}
                <strong>{questions.length}</strong> questions.
              </p>
              {answeredCount < questions.length && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg mt-2 font-medium">
                  Warning: You have {questions.length - answeredCount} unanswered questions!
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition-colors"
              >
                Continue Test
              </button>
              <button
                onClick={executeSubmission}
                disabled={submitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Grading...</span>
                  </>
                ) : (
                  <span>Yes, Submit Now</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
