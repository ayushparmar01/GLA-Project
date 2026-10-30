import React, { useState } from 'react';
import {
  AtsAiFeedback,
  ResumeSuggestionData,
} from '../../types';
import {
  Sparkles,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Cpu,
  FileEdit,
} from 'lucide-react';
import { updateResumeSuggestionStatusApi } from '../../services/api';

interface AIBulletOptimizationPanelProps {
  aiFeedback: AtsAiFeedback;
  suggestions: ResumeSuggestionData[];
  token?: string | null;
  onSuggestionUpdated?: () => void;
  onApplyToWorkspace?: (suggestedText: string, originalText: string) => void;
}

export const AIBulletOptimizationPanel: React.FC<AIBulletOptimizationPanelProps> = ({
  aiFeedback,
  suggestions,
  token,
  onSuggestionUpdated,
  onApplyToWorkspace,
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (suggestionId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setUpdatingId(suggestionId);
    try {
      const res = await updateResumeSuggestionStatusApi(suggestionId, status, token);
      if (res.success && onSuggestionUpdated) {
        onSuggestionUpdated();
      }
    } catch {
      // Handled
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            AI Resume Bullet Optimizer &amp; Coaching
          </div>
          <h3 className="text-lg font-bold text-slate-900">Action-Oriented Bullet Enhancements</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Transform passive duty descriptions into high-impact accomplishment bullets using the Action Verb + Context framework.
          </p>
        </div>

        {aiFeedback.isFallback && (
          <span className="px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[10px] font-bold self-start sm:self-auto">
            Deterministic Engine Mode
          </span>
        )}
      </div>

      {/* Overall AI Feedback Box */}
      <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2">
        <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
          Strategic Assessment
        </span>
        <p className="text-xs text-purple-950 leading-relaxed">{aiFeedback.overallFeedback}</p>
      </div>

      {/* Suggested Summary Objective */}
      {aiFeedback.summarySuggestion && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileEdit className="w-3.5 h-3.5 text-indigo-600" />
              Tailored Career Objective Proposal
            </span>
          </div>
          <p className="text-xs text-slate-800 italic leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
            "{aiFeedback.summarySuggestion}"
          </p>
        </div>
      )}

      {/* Bullet Suggestions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Identified Bullet Points for Optimization ({aiFeedback.bulletSuggestions.length})
          </h4>
          <span className="text-[10px] text-slate-400">Review &amp; Accept</span>
        </div>

        {aiFeedback.bulletSuggestions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
            No weak bullet points identified. Existing bullets follow good technical phrasing.
          </div>
        ) : (
          <div className="space-y-4">
            {aiFeedback.bulletSuggestions.map((item, idx) => {
              // Find matching DB suggestion record if present
              const matchingDbSug = suggestions.find(
                (s) => s.originalText === item.originalBullet
              );
              const isAccepted = matchingDbSug?.status === 'ACCEPTED';
              const isRejected = matchingDbSug?.status === 'REJECTED';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    isAccepted
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : isRejected
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">{item.section}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                      Verb: {item.actionVerbUsed}
                    </span>
                  </div>

                  {/* Original vs Suggested */}
                  <div className="space-y-2 text-xs">
                    <div className="bg-rose-50/60 p-2.5 rounded-lg border border-rose-100 text-rose-900">
                      <span className="text-[10px] font-bold uppercase text-rose-700 block mb-0.5">Original:</span>
                      <span>{item.originalBullet}</span>
                    </div>

                    <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200 text-emerald-950 font-medium">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Action-Oriented Recommendation:
                      </span>
                      <span>{item.suggestedBullet}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">{item.reason}</p>

                  {/* Actions */}
                  {matchingDbSug && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        {isAccepted && (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted into workspace
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[11px] font-medium text-slate-400">
                            Suggestion dismissed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(matchingDbSug.id, 'REJECTED')}
                          disabled={updatingId === matchingDbSug.id}
                          className={`px-3 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                            isRejected
                              ? 'bg-slate-200 text-slate-700 border-slate-300'
                              : 'text-slate-500 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateStatus(matchingDbSug.id, 'ACCEPTED');
                            if (onApplyToWorkspace) {
                              onApplyToWorkspace(item.suggestedBullet, item.originalBullet);
                            }
                          }}
                          disabled={updatingId === matchingDbSug.id}
                          className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept &amp; Apply</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Tips & Interview Prep */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Project Tips */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Project Architecture Tips
          </span>
          <div className="space-y-1.5">
            {aiFeedback.projectImprovementTips.map((tip, idx) => (
              <div key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                <span className="text-indigo-600 font-bold">&bull;</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interview Prep Questions */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Anticipated Technical Interview Queries
          </span>
          <div className="space-y-1.5">
            {aiFeedback.interviewPrepTips.map((tip, idx) => (
              <div key={idx} className="text-xs text-slate-700 flex items-start gap-2">
                <span className="text-purple-600 font-bold">&bull;</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ethical AI Disclaimer */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-[11px] text-slate-500">
        <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Ethical AI Guardrail:</strong> AI suggestions are strictly tailored to your actual listed projects and technologies. Our algorithms will never fabricate corporate experience, fake metrics, or unearned certifications.
        </p>
      </div>
    </div>
  );
};
