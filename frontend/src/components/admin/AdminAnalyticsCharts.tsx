import React from 'react';
import { PlatformAnalyticsReport } from '../../types';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface AdminAnalyticsChartsProps {
  analytics: PlatformAnalyticsReport | null;
  loading: boolean;
}

export const AdminAnalyticsCharts: React.FC<AdminAnalyticsChartsProps> = ({ analytics, loading }) => {
  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
        Loading platform analytics & placement outcome reports...
      </div>
    );
  }

  if (!analytics) return null;

  const { applicationFunnel, transparentPlacementOutcomes, opportunityCategories, topSkillsInDemand } =
    analytics;

  const funnelSteps = [
    { label: 'Applications Submitted', count: applicationFunnel.applied, color: 'bg-blue-500' },
    { label: 'Shortlisted for Review', count: applicationFunnel.shortlisted, color: 'bg-teal-500' },
    { label: 'Interviews Scheduled', count: applicationFunnel.interviewScheduled, color: 'bg-indigo-500' },
    { label: 'Selected for Placement', count: applicationFunnel.selected, color: 'bg-emerald-500' },
    { label: 'Rejected / Disqualified', count: applicationFunnel.rejected, color: 'bg-rose-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Placement Outcome Transparency Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-emerald-950">
              Ethical & Transparent Placement Reporting (MISSION BHARAT Standards)
            </h4>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {transparentPlacementOutcomes.note}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-emerald-200/60">
          <div>
            <div className="text-xs font-medium text-emerald-700">Total Selected</div>
            <div className="text-xl font-bold text-emerald-950">{transparentPlacementOutcomes.totalSelected}</div>
            <div className="text-[10px] text-emerald-600">Candidates selected</div>
          </div>
          <div>
            <div className="text-xs font-medium text-emerald-700">Confirmed Offers</div>
            <div className="text-xl font-bold text-emerald-950">{transparentPlacementOutcomes.offerConfirmed}</div>
            <div className="text-[10px] text-emerald-600">Verified offer letters</div>
          </div>
          <div>
            <div className="text-xs font-medium text-emerald-700">Joined Recruiter</div>
            <div className="text-xl font-bold text-emerald-950">{transparentPlacementOutcomes.joined}</div>
            <div className="text-[10px] text-emerald-600">Onboarded at company</div>
          </div>
          <div>
            <div className="text-xs font-medium text-emerald-700">Outcome Verified</div>
            <div className="text-xl font-bold text-emerald-950">{transparentPlacementOutcomes.outcomeVerified}</div>
            <div className="text-[10px] text-emerald-600">By college TPO / Portal</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Funnel Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> Recruitment Funnel Conversion
            </h4>
            <span className="text-xs text-slate-500">{applicationFunnel.applied} total entries</span>
          </div>

          <div className="space-y-3">
            {funnelSteps.map((step, idx) => {
              const pct = applicationFunnel.applied > 0
                ? Math.round((step.count / applicationFunnel.applied) * 100)
                : 0;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span className="font-medium text-slate-800">{step.label}</span>
                    <span>
                      <strong>{step.count}</strong> ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${step.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* In-Demand Skills & Opportunity Categories */}
        <div className="space-y-6">
          {/* Top Skills */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Top In-Demand Skills from Employers
              </h4>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {topSkillsInDemand.length === 0 ? (
                <span className="text-xs text-slate-400">No skill requirements recorded yet.</span>
              ) : (
                topSkillsInDemand.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200"
                  >
                    <span>{s.skill}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white text-indigo-700 font-bold">
                      {s.count}
                    </span>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Opportunity Categories */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-600" /> Opportunities by Category
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              {opportunityCategories.map((cat, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                  <div className="text-xs font-semibold text-slate-600 uppercase">{cat.category}</div>
                  <div className="text-xl font-bold text-slate-900 mt-1">{cat.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
