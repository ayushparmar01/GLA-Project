import React from 'react';
import { AtsSkillGapItem } from '../../types';
import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Target,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface SkillGapReportCardProps {
  skillGaps: AtsSkillGapItem[];
}

export const SkillGapReportCard: React.FC<SkillGapReportCardProps> = ({
  skillGaps,
}) => {
  const getPriorityBadge = (p: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (p) {
      case 'HIGH':
        return {
          label: 'High Priority (Mandatory)',
          color: 'bg-rose-50 text-rose-800 border-rose-200',
        };
      case 'MEDIUM':
        return {
          label: 'Medium Priority (Preferred)',
          color: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      default:
        return {
          label: 'Low Priority (Bonus)',
          color: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
          <Target className="w-3.5 h-3.5 text-amber-600" />
          Prioritized Skill Gap Action Plan
        </div>
        <h3 className="text-lg font-bold text-slate-900">Skill Discrepancies &amp; Curated Learning Tracks</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Focus your preparation on closing high-priority technical gaps before applying to this opportunity.
        </p>
      </div>

      {/* Skill Gaps List */}
      {skillGaps.length === 0 ? (
        <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>No critical skill gaps identified. Your technical stack closely aligns with this role!</span>
        </div>
      ) : (
        <div className="space-y-3">
          {skillGaps.map((item, idx) => {
            const badge = getPriorityBadge(item.priority);
            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{item.skill}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 capitalize">{item.category}</span>
                </div>

                {/* Curated Free Learning Resources */}
                {item.learningResources && item.learningResources.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Recommended Learning Resource:
                    </span>
                    {item.learningResources.map((res, rIdx) => (
                      <div
                        key={rIdx}
                        className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <BookOpen className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{res.title}</span>
                          <span className="text-slate-400 text-[11px] hidden sm:inline">&bull; {res.provider}</span>
                        </div>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1 flex-shrink-0"
                        >
                          <span>Learn Free</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
