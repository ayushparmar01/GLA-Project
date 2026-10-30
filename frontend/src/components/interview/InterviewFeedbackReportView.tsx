import React from 'react';
import { MockInterviewSessionData } from '../../types';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Code2,
  Target,
  Sparkles,
  Info,
  ChevronDown,
} from 'lucide-react';

interface InterviewFeedbackReportViewProps {
  session: MockInterviewSessionData;
  onPracticeAgain: () => void;
  onViewAnalytics: () => void;
  onExit: () => void;
}

export const InterviewFeedbackReportView: React.FC<InterviewFeedbackReportViewProps> = ({
  session,
  onPracticeAgain,
  onViewAnalytics,
  onExit,
}) => {
  const evaluation = session.evaluation;
  if (!evaluation) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Evaluation Pending</h3>
        <p className="text-xs text-slate-500">The session is currently awaiting evaluation review.</p>
        <button onClick={onExit} className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg">
          Back
        </button>
      </div>
    );
  }

  const overallScore = evaluation.overallScore || 0;
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 border-emerald-500 bg-emerald-50';
    if (score >= 60) return 'text-blue-600 border-blue-500 bg-blue-50';
    if (score >= 40) return 'text-amber-600 border-amber-500 bg-amber-50';
    return 'text-rose-600 border-rose-500 bg-rose-50';
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-fadeIn">
      {/* Top Banner: Score & Rationale */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              Mock Evaluation Complete · Rubric {evaluation.rubricVersion}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {session.targetRole} Performance Report
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Transparent, question-by-question evaluation assessing technical correctness, communication clarity, and STAR structure.
            </p>
          </div>

          {/* Overall Score Circle */}
          <div className="flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 min-w-[140px] text-center">
            <span className="text-4xl font-extrabold text-emerald-400">{overallScore}%</span>
            <span className="text-xs font-semibold text-slate-300 mt-1">Overall Evaluation</span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {overallScore >= 80
                ? 'Strong Preparedness'
                : overallScore >= 60
                ? 'Solid Foundation'
                : 'Developing Readiness'}
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-start gap-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-500" />
          <span>{evaluation.disclaimer}</span>
        </div>
      </div>

      {/* Summary KPI Cards: Strengths & Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strengths */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Key Demonstrated Strengths
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            {evaluation.strengths.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvement Areas */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Areas for Growth &amp; Practice
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            {evaluation.improvementAreas.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">!</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actionable Next Steps Roadmap */}
      {evaluation.nextSteps && evaluation.nextSteps.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 space-y-2">
          <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Recommended Next Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            {evaluation.nextSteps.map((step, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-emerald-200 text-slate-800 font-medium flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Question-by-Question Deep Dive */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          Question-by-Question Evaluation Breakdown
        </h3>

        <div className="space-y-4">
          {evaluation.questionFeedbacks.map((qf, idx) => {
            const originalQ = session.questions.find((q) => q.id === qf.questionId);
            const scoreClass = getScoreColor(qf.score);

            return (
              <div
                key={qf.questionId}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold">
                        Question {idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
                        {originalQ?.topic || 'General'}
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">{qf.questionText}</h4>
                  </div>

                  <div className={`px-3 py-1.5 rounded-xl border font-bold text-sm shrink-0 ${scoreClass}`}>
                    {qf.score}% Score
                  </div>
                </div>

                {/* Candidate's submitted answer */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Response:</span>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {qf.studentAnswer}
                  </p>
                </div>

                {/* Specific Feedback Points */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="space-y-1">
                    <span className="font-bold text-emerald-800 block">Identified Strengths:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      {qf.strengths.map((str, sIdx) => (
                        <li key={sIdx}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-amber-800 block">Suggestions to Improve:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      {qf.areasForImprovement.map((area, aIdx) => (
                        <li key={aIdx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Missing Concepts Chips */}
                {qf.missingConcepts && qf.missingConcepts.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-semibold text-[11px]">Missing Core Concepts:</span>
                    {qf.missingConcepts.map((concept, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                )}

                {/* STAR Evaluation if present */}
                {qf.starEvaluation && (
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1.5 text-xs">
                    <span className="font-bold text-indigo-900 block text-[11px]">STAR Method Breakdown:</span>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-white p-1.5 rounded border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">Situation</span>
                        <span className="font-bold text-indigo-700">{qf.starEvaluation.situationScore}/25</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">Task</span>
                        <span className="font-bold text-indigo-700">{qf.starEvaluation.taskScore}/25</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">Action</span>
                        <span className="font-bold text-indigo-700">{qf.starEvaluation.actionScore}/25</span>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-indigo-100">
                        <span className="text-[10px] text-slate-400 block font-semibold">Result</span>
                        <span className="font-bold text-indigo-700">{qf.starEvaluation.resultScore}/25</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Coding Evaluation if present */}
                {qf.codingEvaluation && (
                  <div className="p-3 bg-slate-900 text-slate-300 rounded-xl border border-slate-800 space-y-1 text-xs">
                    <span className="font-bold text-emerald-400 block text-[11px] flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" /> Static Code Inspection &amp; Complexity
                    </span>
                    <p className="text-[11px]">{qf.codingEvaluation.complexityExplanation}</p>
                  </div>
                )}

                {/* Model Answer Approach */}
                {qf.suggestedApproach && (
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1">
                    <span className="font-bold text-amber-900 block text-[11px]">Recommended Model Approach:</span>
                    <p className="text-slate-700 text-[11px] leading-relaxed">{qf.suggestedApproach}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation Actions */}
      <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <button
          onClick={onExit}
          className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
        >
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onViewAnalytics}
            className="px-4 py-2 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-700 transition"
          >
            Performance Analytics
          </button>

          <button
            onClick={onPracticeAgain}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Practice Another Interview
          </button>
        </div>
      </div>
    </div>
  );
};
