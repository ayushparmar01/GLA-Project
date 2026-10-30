import React, { useState } from 'react';
import { AssessmentAttemptData } from '../../types';

interface AssessmentResultViewProps {
  attempt: AssessmentAttemptData;
  onBackToCatalogue: () => void;
  onViewCareerReadiness?: () => void;
}

export const AssessmentResultView: React.FC<AssessmentResultViewProps> = ({
  attempt,
  onBackToCatalogue,
  onViewCareerReadiness,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CORRECT' | 'INCORRECT'>('ALL');

  const evaluations = attempt.questionEvaluations || [];
  const skillResults = attempt.skillWiseResults || [];

  const filteredEvaluations = evaluations.filter((ev) => {
    if (activeFilter === 'CORRECT') return ev.isCorrect;
    if (activeFilter === 'INCORRECT') return !ev.isCorrect;
    return true;
  });

  const formatSeconds = (sec?: number) => {
    if (!sec) return 'N/A';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Scorecard Banner */}
      <div
        className={`rounded-2xl p-6 md:p-8 text-white shadow-md border ${
          attempt.passed
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 border-emerald-500'
            : 'bg-gradient-to-r from-rose-700 via-red-600 to-orange-700 border-red-500'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 backdrop-blur-md">
                {attempt.passed ? 'Assessment Passed' : 'Assessment Completed'}
              </span>
              <span className="text-xs text-white/80">•</span>
              <span className="text-xs text-white/90 font-medium">{attempt.category}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {attempt.assessmentTitle}
            </h2>
            <p className="text-white/90 text-sm max-w-xl">
              {attempt.passed
                ? 'Congratulations! You have verified your competency in these skills. This achievement has been recorded on your student profile and will elevate your recruiter matching rank.'
                : 'Good effort! Review the detailed explanations below to understand your missed questions, then retake the assessment after reviewing the recommended study materials.'}
            </p>
          </div>

          {/* Large Score Circle / Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center min-w-[160px] shrink-0">
            <span className="block text-4xl font-black">{attempt.percentage}%</span>
            <span className="text-xs text-white/90 font-medium mt-1 block">
              Score: {attempt.score} / {attempt.totalMarks} Marks
            </span>
            <span className="text-[11px] text-white/70 block mt-1">
              Time Taken: {formatSeconds(attempt.timeTakenSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Skill-Wise Breakdown Cards */}
      {skillResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 text-base mb-4">
            Skill-Wise Performance Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {skillResults.map((sr, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{sr.skill}</span>
                  <span
                    className={`font-extrabold ${
                      sr.percentage >= 60 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {sr.percentage}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sr.percentage >= 60 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, sr.percentage)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>
                    Correct: {sr.correctQuestions} / {sr.totalQuestions}
                  </span>
                  <span>
                    Score: {sr.score} / {sr.maxScore} marks
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Question Review */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Question-by-Question Review</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review correct answers and comprehensive explanations to reinforce your learning.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            {(['ALL', 'CORRECT', 'INCORRECT'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeFilter === filter
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'ALL'
                  ? `All (${evaluations.length})`
                  : filter === 'CORRECT'
                  ? `Correct (${evaluations.filter((e) => e.isCorrect).length})`
                  : `Incorrect (${evaluations.filter((e) => !e.isCorrect).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* List of Evaluated Questions */}
        <div className="space-y-6">
          {filteredEvaluations.map((ev, idx) => (
            <div
              key={ev.questionId || idx}
              className={`rounded-xl border p-5 space-y-4 ${
                ev.isCorrect
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      ev.isCorrect
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {ev.questionType.replace('_', ' ')}
                  </span>
                  {ev.skill && (
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                      {ev.skill}
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold">
                  {ev.isCorrect ? (
                    <span className="text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      +{ev.marksAwarded} Marks (Correct)
                    </span>
                  ) : (
                    <span className="text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full">
                      {ev.marksAwarded} Marks (Incorrect)
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-slate-900 font-semibold text-sm leading-relaxed">
                {ev.questionText}
              </div>

              {/* Code Snippet if present */}
              {ev.codeSnippet && (
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto">
                  {ev.codeSnippet}
                </pre>
              )}

              {/* Options Breakdown */}
              <div className="space-y-2 pt-2">
                {ev.options.map((opt) => {
                  const wasSelected = ev.selectedAnswers?.includes(opt.id);
                  const isCorrectAnswer = ev.correctAnswers?.includes(opt.id);

                  let badgeStyle = 'border-slate-200 bg-white text-slate-700';
                  if (isCorrectAnswer && wasSelected) {
                    badgeStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                  } else if (isCorrectAnswer) {
                    badgeStyle =
                      'border-emerald-400 bg-emerald-50/60 text-emerald-800 font-semibold';
                  } else if (wasSelected) {
                    badgeStyle = 'border-rose-400 bg-rose-50 text-rose-900 line-through';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${badgeStyle}`}
                    >
                      <span>{opt.text}</span>
                      <div className="shrink-0 flex items-center gap-1.5 text-[11px]">
                        {wasSelected && (
                          <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-medium">
                            Your Choice
                          </span>
                        )}
                        {isCorrectAnswer && (
                          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
                            Correct Answer
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {ev.explanation && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-1">
                  <span className="font-bold text-indigo-700 uppercase tracking-wider text-[11px] block">
                    Why is this correct?
                  </span>
                  <p className="text-slate-600 leading-relaxed">{ev.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
        <button
          onClick={onBackToCatalogue}
          className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
        >
          ← Back to Assessments Catalogue
        </button>

        {onViewCareerReadiness && (
          <button
            onClick={onViewCareerReadiness}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>View Updated Career Readiness Score</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
