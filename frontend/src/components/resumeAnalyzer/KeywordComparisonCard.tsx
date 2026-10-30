import React from 'react';
import { AtsKeywordAnalysis } from '../../types';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  PlusCircle,
  Sparkles,
  AlertTriangle,
  Layers,
} from 'lucide-react';

interface KeywordComparisonCardProps {
  keywordAnalysis: AtsKeywordAnalysis;
}

export const KeywordComparisonCard: React.FC<KeywordComparisonCardProps> = ({
  keywordAnalysis,
}) => {
  const { matchedKeywords, missingKeywords, partiallyMatchedKeywords, additionalResumeKeywords } =
    keywordAnalysis;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-semibold mb-2">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          Keyword Alignment Matrix
        </div>
        <h3 className="text-lg font-bold text-slate-900">Job Description vs. Resume Keywords</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Detailed breakdown of matching competencies, missing requirements, and variant industry terminology.
        </p>
      </div>

      {/* Grid of Keyword Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Matched Keywords */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Matched Keywords ({matchedKeywords.length})
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              Found in Resume
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[60px] p-3 bg-emerald-50/40 rounded-xl border border-emerald-100">
            {matchedKeywords.length === 0 ? (
              <span className="text-xs text-slate-400">No exact keywords matched.</span>
            ) : (
              matchedKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {kw}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Missing Keywords */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              Missing Target Keywords ({missingKeywords.length})
            </span>
            <span className="text-[10px] text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full">
              Required by Job
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[60px] p-3 bg-rose-50/40 rounded-xl border border-rose-100">
            {missingKeywords.length === 0 ? (
              <span className="text-xs text-emerald-700 font-medium">All target job keywords identified!</span>
            ) : (
              missingKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-medium border border-rose-200"
                >
                  <XCircle className="w-3 h-3 text-rose-600" />
                  {kw}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Partially Matched Keywords */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Partially Matched / Synonyms ({partiallyMatchedKeywords.length})
            </span>
            <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full">
              Wording Alignment
            </span>
          </div>

          <div className="space-y-2 min-h-[60px] p-3 bg-amber-50/40 rounded-xl border border-amber-100">
            {partiallyMatchedKeywords.length === 0 ? (
              <span className="text-xs text-slate-400">No variant terms detected.</span>
            ) : (
              partiallyMatchedKeywords.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-200 text-xs"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-900">{item.keyword}</span>
                    <span className="text-slate-400">&larr;</span>
                    <span className="text-slate-600 italic">"{item.resumeTerm}" in resume</span>
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                    Update wording
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Additional Resume Skills */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-slate-500" />
              Additional Skills in Resume ({additionalResumeKeywords.length})
            </span>
            <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
              Bonus Capabilities
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[60px] p-3 bg-slate-50 rounded-xl border border-slate-200">
            {additionalResumeKeywords.length === 0 ? (
              <span className="text-xs text-slate-400">No additional skills detected.</span>
            ) : (
              additionalResumeKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white text-slate-700 text-xs font-medium border border-slate-200"
                >
                  {kw}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Honest Skill Disclosure Reminder */}
      <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Authenticity Reminder:</strong> Only add a skill or technology to your resume if you genuinely understand it and can comfortably answer technical interview questions about it. Do not engage in keyword stuffing or add skills you cannot demonstrate.
        </p>
      </div>
    </div>
  );
};
