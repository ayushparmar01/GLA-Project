import React from 'react';
import {
  AtsScoreBreakdown,
  AtsScoreTier,
} from '../../types';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  FileCheck2,
  BookOpen,
  FolderGit2,
  Star,
  Sparkles,
} from 'lucide-react';

interface AtsScoreCardProps {
  score: number;
  tier: AtsScoreTier;
  breakdown: AtsScoreBreakdown;
  dataCoverage: number;
  reasons: string[];
  jobTitle: string;
  companyName: string;
  disclaimer: string;
}

export const AtsScoreCard: React.FC<AtsScoreCardProps> = ({
  score,
  tier,
  breakdown,
  dataCoverage,
  reasons,
  jobTitle,
  companyName,
  disclaimer,
}) => {
  const getTierBadge = (t: AtsScoreTier) => {
    switch (t) {
      case 'STRONG_ALIGNMENT':
        return {
          label: 'Strong Alignment',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          textColor: 'text-emerald-700',
        };
      case 'GOOD_ALIGNMENT':
        return {
          label: 'Good Alignment',
          color: 'bg-indigo-50 text-indigo-800 border-indigo-300',
          textColor: 'text-indigo-700',
        };
      case 'MODERATE_ALIGNMENT':
        return {
          label: 'Moderate Alignment',
          color: 'bg-amber-50 text-amber-800 border-amber-300',
          textColor: 'text-amber-700',
        };
      default:
        return {
          label: 'Needs Improvement',
          color: 'bg-rose-50 text-rose-800 border-rose-300',
          textColor: 'text-rose-700',
        };
    }
  };

  const tierInfo = getTierBadge(tier);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Target Opportunity Alignment
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            {jobTitle} &bull; <span className="text-slate-600 font-normal">{companyName}</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full border text-xs font-bold ${tierInfo.color}`}>
            {tierInfo.label}
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs text-slate-600 font-semibold">
            Data Coverage: {dataCoverage}%
          </div>
        </div>
      </div>

      {/* Main Score Hero */}
      <div className="flex flex-col md:flex-row items-center gap-8 py-2">
        {/* Score Circle / Meter */}
        <div className="relative flex flex-col items-center justify-center w-36 h-36 rounded-full bg-gradient-to-tr from-slate-900 to-indigo-950 text-white shadow-lg flex-shrink-0">
          <Award className="w-6 h-6 text-emerald-400 mb-1" />
          <span className="text-4xl font-black font-heading tracking-tight">{score}</span>
          <span className="text-[11px] text-slate-300 font-medium">out of 100</span>
          <div className="absolute -bottom-2 px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full shadow-xs uppercase">
            ATS Score
          </div>
        </div>

        {/* Explainable Summary */}
        <div className="flex-1 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Key Factors Behind Your Score
          </h4>
          <div className="space-y-1.5">
            {reasons.slice(0, 4).map((reason, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7-Component Weighted Breakdown */}
      <div className="pt-4 border-t border-slate-100 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          7-Component ATS Score Breakdown (100% Total)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. Required Skills (30%) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Required Skills</span>
              <span className="font-bold text-indigo-700">{breakdown.requiredSkillCoverage} / 30</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${(breakdown.requiredSkillCoverage / 30) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">Core mandatory competencies</span>
          </div>

          {/* 2. Job Keyword Alignment (20%) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Job Keywords</span>
              <span className="font-bold text-indigo-700">{breakdown.jobKeywordAlignment} / 20</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${(breakdown.jobKeywordAlignment / 20) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">Exact &amp; partial term matching</span>
          </div>

          {/* 3. Projects & Experience (15%) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Projects &amp; Experience</span>
              <span className="font-bold text-indigo-700">{breakdown.projectExperienceAlignment} / 15</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${(breakdown.projectExperienceAlignment / 15) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">Fresher-friendly project credit</span>
          </div>

          {/* 4. Education & Qualifications (10%) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Education Alignment</span>
              <span className="font-bold text-indigo-700">{breakdown.educationAlignment} / 10</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${(breakdown.educationAlignment / 10) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">Degree &amp; branch match</span>
          </div>

          {/* 5. Section Completeness (10%) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Section Structure</span>
              <span className="font-bold text-indigo-700">{breakdown.structureCompleteness} / 10</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${(breakdown.structureCompleteness / 10) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">Standard resume layout</span>
          </div>

          {/* 6. Achievements & Certs (10%) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Achievements &amp; Certs</span>
              <span className="font-bold text-indigo-700">{breakdown.achievementsCertifications} / 10</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${(breakdown.achievementsCertifications / 10) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">Verified credentials &amp; portfolio</span>
          </div>

          {/* 7. Formatting & Readability (5%) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 sm:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Formatting &amp; Readability (5%)</span>
              <span className="font-bold text-indigo-700">{breakdown.formattingChecks} / 5</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full"
                style={{ width: `${(breakdown.formattingChecks / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 block">
              Concise paragraphs, clean typography, and selectable text
            </span>
          </div>
        </div>
      </div>

      {/* Internal Guidance Disclaimer */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Internal Guidance Disclaimer:</strong> {disclaimer}
        </p>
      </div>
    </div>
  );
};
