import React, { useState, useEffect } from 'react';
import { CollegePlacementIntelligenceReport } from '../../types';
import { fetchCollegePlacementIntelligenceApi } from '../../services/api';
import {
  BrainCircuit,
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Briefcase,
  Building,
  RefreshCw,
  BarChart3,
} from 'lucide-react';

interface CollegePlacementIntelligenceCardProps {
  token?: string | null;
}

export const CollegePlacementIntelligenceCard: React.FC<CollegePlacementIntelligenceCardProps> = ({
  token,
}) => {
  const [report, setReport] = useState<CollegePlacementIntelligenceReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIntelligence();
  }, [token]);

  const loadIntelligence = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCollegePlacementIntelligenceApi(token);
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setError(res.error?.message || 'Failed to fetch placement intelligence.');
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error fetching placement intelligence');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Aggregating institutional placement intelligence...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <p className="text-xs text-slate-500">Placement intelligence currently unavailable.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
            <BrainCircuit className="w-3.5 h-3.5 text-emerald-600" />
            Phase 13 Placement Intelligence
          </div>
          <h3 className="text-lg font-bold text-slate-900">Institutional Placement &amp; Skill Insights</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time analytics on student eligibility, in-demand industry skills, and institutional curriculum gaps.
          </p>
        </div>

        <button
          onClick={loadIntelligence}
          className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 self-start sm:self-auto"
          title="Refresh intelligence data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Top 3 KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 block">Total Students</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{report.totalStudents}</span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <span className="text-xs font-semibold text-emerald-700 block">Complete Profiles</span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">{report.completeProfileCount}</span>
          <span className="text-[11px] text-emerald-600">
            {report.totalStudents > 0
              ? `${Math.round((report.completeProfileCount / report.totalStudents) * 100)}% placement ready`
              : '0%'}
          </span>
        </div>

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
          <span className="text-xs font-semibold text-amber-700 block">Incomplete Profiles</span>
          <span className="text-2xl font-black text-amber-800 mt-1 block">{report.incompleteProfileCount}</span>
          <span className="text-[11px] text-amber-600">Need academic/skill details</span>
        </div>
      </div>

      {/* Two columns: In-Demand Skills vs Common Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Top In-Demand Skills */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            Top In-Demand Skills by Recruiters
          </h4>
          <div className="space-y-2">
            {report.topInDemandSkills.length === 0 ? (
              <p className="text-xs text-slate-400">No active drive skills recorded yet.</p>
            ) : (
              report.topInDemandSkills.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs"
                >
                  <span className="font-semibold text-slate-800">{item.skill}</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                    {item.demandCount} drives
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Common Skill Gaps across Students */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Top Skill Gaps Among Students
          </h4>
          <div className="space-y-2">
            {report.commonSkillGaps.length === 0 ? (
              <p className="text-xs text-slate-400">No student gaps identified.</p>
            ) : (
              report.commonSkillGaps.slice(0, 5).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs"
                >
                  <span className="font-semibold text-slate-800">{item.skill}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                    {item.gapCount} students missing
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Drive Eligibility Breakdown */}
      {report.driveEligibilityBreakdown.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
            Drive Eligibility Breakdown
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.driveEligibilityBreakdown.slice(0, 6).map((drive, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-900 block truncate">{drive.driveTitle}</span>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span className="text-emerald-700 font-semibold">{drive.eligibleCount} Eligible</span>
                  <span className="text-rose-600 font-semibold">{drive.ineligibleCount} Ineligible</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-1.5"
                    style={{
                      width: `${
                        drive.totalEvaluated > 0 ? (drive.eligibleCount / drive.totalEvaluated) * 100 : 0
                      }%`,
                    }}
                  />
                  <div
                    className="bg-rose-400 h-1.5"
                    style={{
                      width: `${
                        drive.totalEvaluated > 0 ? (drive.ineligibleCount / drive.totalEvaluated) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
