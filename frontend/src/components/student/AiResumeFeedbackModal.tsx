import React, { useState, useEffect } from 'react';
import { getAiResumeFeedbackApi } from '../../services/api';
import { ResumeFeedbackReport, ResumeFeedbackSection } from '../../types';
import {
  X,
  FileCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Award,
  Tag,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AiResumeFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  resumeId?: string;
  targetRole?: string;
  structuredContent?: any;
}

export const AiResumeFeedbackModal: React.FC<AiResumeFeedbackModalProps> = ({
  isOpen,
  onClose,
  token,
  resumeId,
  targetRole = 'Software Engineer',
  structuredContent,
}) => {
  const [report, setReport] = useState<ResumeFeedbackReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadFeedback();
    }
  }, [isOpen, resumeId, targetRole]);

  const loadFeedback = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await getAiResumeFeedbackApi(
        { resumeId, targetRole, structuredContent },
        token
      );
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setErrorMessage(res.error?.message || 'Failed to generate resume feedback');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error analyzing resume');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                ATS Resume Diagnostic & Keyword Analysis
              </h3>
              <p className="text-xs text-slate-400">Target Role: {targetRole}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
              <p>Analyzing resume sections and role keyword alignment...</p>
            </div>
          ) : errorMessage ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : report ? (
            <div className="space-y-5">
              {/* Overall Score Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 border border-indigo-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                    Overall Diagnostic Score
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-white">
                    {report.overallScore} / 100
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md">{report.summary}</p>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>
                    ATS Fit: {report.overallScore >= 80 ? 'High' : report.overallScore >= 60 ? 'Moderate' : 'Needs Review'}
                  </span>
                </div>
              </div>

              {/* Role Relevance Keywords */}
              {report.roleRelevance && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h5 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    Target Role Keyword Match: {report.roleRelevance.targetRole || targetRole}
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                        Detected Keywords ({report.roleRelevance.matchingKeywords.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {report.roleRelevance.matchingKeywords.length > 0 ? (
                          report.roleRelevance.matchingKeywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            >
                              {kw}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">No exact keywords found</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-amber-400 block mb-1">
                        Recommended Additional Keywords:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {report.roleRelevance.missingKeywords.length > 0 ? (
                          report.roleRelevance.missingKeywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30"
                            >
                              {kw}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Good keyword coverage</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Breakdown */}
              <div className="space-y-2.5">
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Detailed Section Analysis ({report.sections.length} Sections)
                </h5>

                <div className="space-y-2">
                  {report.sections.map((sec) => {
                    const isExpanded = expandedSections[sec.sectionName] ?? true;
                    return (
                      <div
                        key={sec.sectionName}
                        className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSection(sec.sectionName)}
                          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                sec.status === 'STRONG'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : sec.status === 'ADEQUATE'
                                  ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}
                            >
                              {sec.status}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {sec.sectionName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">
                              Score: {sec.score}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-3.5 pt-1 border-t border-slate-800/60 space-y-2 text-xs">
                            {sec.strengths.length > 0 && (
                              <div>
                                <span className="text-[11px] font-semibold text-emerald-400">
                                  Strengths:
                                </span>
                                <ul className="list-disc list-inside text-slate-300 mt-0.5 space-y-0.5">
                                  {sec.strengths.map((str, i) => (
                                    <li key={i}>{str}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {sec.weaknesses.length > 0 && (
                              <div>
                                <span className="text-[11px] font-semibold text-amber-400">
                                  Weaknesses:
                                </span>
                                <ul className="list-disc list-inside text-slate-300 mt-0.5 space-y-0.5">
                                  {sec.weaknesses.map((w, i) => (
                                    <li key={i}>{w}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {sec.actionableSuggestions.length > 0 && (
                              <div className="p-2.5 rounded-lg bg-indigo-950/20 border border-indigo-800/30">
                                <span className="text-[11px] font-semibold text-indigo-300">
                                  Actionable Improvement:
                                </span>
                                <ul className="text-slate-300 mt-0.5 space-y-0.5">
                                  {sec.actionableSuggestions.map((sug, i) => (
                                    <li key={i} className="flex items-start gap-1.5">
                                      <span className="text-indigo-400">•</span>
                                      <span>{sug}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legal Advisory Disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-500 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{report.disclaimer}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Close Diagnostic
          </button>
        </div>
      </div>
    </div>
  );
};
