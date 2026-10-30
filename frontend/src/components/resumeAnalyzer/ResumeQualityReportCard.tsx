import React from 'react';
import { AtsResumeQualityReport } from '../../types';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  FolderGit2,
  Briefcase,
  LayoutTemplate,
} from 'lucide-react';

interface ResumeQualityReportCardProps {
  qualityReport: AtsResumeQualityReport;
}

export const ResumeQualityReportCard: React.FC<ResumeQualityReportCardProps> = ({
  qualityReport,
}) => {
  const {
    contactCompleteness,
    structureCompleteness,
    projectQuality,
    experienceQuality,
    formattingChecks,
    fresherFriendly,
    overallQualityScore,
    warnings,
  } = qualityReport;

  const renderStatusPill = (status: 'PASS' | 'WARNING' | 'NEEDS_ATTENTION') => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PASS
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> REVIEW
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> ATTENTION
          </span>
        );
    }
  };

  const sections = [
    {
      title: 'Contact Information',
      icon: UserCheck,
      check: contactCompleteness,
    },
    {
      title: 'Section Structure',
      icon: LayoutTemplate,
      check: structureCompleteness,
    },
    {
      title: 'Project Technical Depth',
      icon: FolderGit2,
      check: projectQuality,
    },
    {
      title: 'Work / Internship Experience',
      icon: Briefcase,
      check: experienceQuality,
      extraBadge: fresherFriendly ? 'Fresher-Friendly Credit' : undefined,
    },
    {
      title: 'Formatting & Typography',
      icon: FileCheck2,
      check: formattingChecks,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-semibold mb-2">
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
            Resume Structural Integrity Audit
          </div>
          <h3 className="text-lg font-bold text-slate-900">Resume Quality &amp; Formatting Diagnostics</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic evaluation of section boundaries, contact details, project contributions, and readability.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-600">Quality Score:</span>
          <span className="text-base font-black text-indigo-700">{overallQualityScore} / 100</span>
        </div>
      </div>

      {/* 5 Area Checklist Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sections.map((sec, idx) => {
          const Icon = sec.icon;
          return (
            <div
              key={idx}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
                    <Icon className="w-4 h-4 text-indigo-600" />
                    <span>{sec.title}</span>
                  </div>
                  {renderStatusPill(sec.check.status)}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{sec.check.notes}</p>
              </div>

              {sec.extraBadge && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {sec.extraBadge}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quality Warnings */}
      {warnings.length > 0 && (
        <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Recommended Improvements ({warnings.length})</span>
          </div>
          <div className="space-y-1">
            {warnings.map((warn, wIdx) => (
              <div key={wIdx} className="text-xs text-amber-800 flex items-start gap-2">
                <span className="text-amber-600 font-bold">&bull;</span>
                <span>{warn}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
