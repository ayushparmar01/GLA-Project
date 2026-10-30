import React, { useState, useEffect } from 'react';
import { CollegeInterviewAnalyticsReport } from '../../types';
import { fetchCollegeInterviewAnalyticsApi } from '../../services/api';
import {
  BrainCircuit,
  Users,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Award,
  Sparkles,
} from 'lucide-react';

interface CollegeInterviewReadinessCardProps {
  token?: string | null;
}

export const CollegeInterviewReadinessCard: React.FC<CollegeInterviewReadinessCardProps> = ({
  token,
}) => {
  const [report, setReport] = useState<CollegeInterviewAnalyticsReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [token]);

  const loadAnalytics = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCollegeInterviewAnalyticsApi(token);
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setError(res.error?.message || 'Failed to fetch interview readiness analytics.');
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error fetching interview readiness analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Aggregating student interview preparation readiness...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>Interview readiness analytics temporarily unavailable.</span>
        </div>
        <button
          onClick={loadAnalytics}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  const categoryEntries = Object.entries(report.categoryBreakdown || {});

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-semibold mb-2">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-600" />
            Phase 14 · AI Interview Readiness Intelligence
          </div>
          <h3 className="text-lg font-bold text-slate-900">Student Interview Readiness &amp; Practice Health</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated institutional benchmarks from student technical, behavioral, and job-specific mock interviews.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 self-start sm:self-auto cursor-pointer"
          title="Refresh interview analytics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Top 3 KPI stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 block flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" /> Practicing Students
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {report.totalStudentsParticipating}
          </span>
          <span className="text-[11px] text-slate-500">Active in mock prep</span>
        </div>

        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <span className="text-xs font-semibold text-indigo-700 block flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-indigo-600" /> Average Readiness Score
          </span>
          <span className="text-2xl font-black text-indigo-900 mt-1 block">
            {report.averageReadinessScore} / 100
          </span>
          <span className="text-[11px] text-indigo-600">
            {report.averageReadinessScore >= 75
              ? 'Strong placement readiness'
              : report.averageReadinessScore >= 50
              ? 'Moderate readiness · Practice suggested'
              : 'Early stage preparation'}
          </span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <span className="text-xs font-semibold text-emerald-700 block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed Mock Sessions
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            {report.totalSessionsCompleted}
          </span>
          <span className="text-[11px] text-emerald-600">Evaluated AI sessions</span>
        </div>
      </div>

      {/* Track Breakdown */}
      {categoryEntries.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            Interview Track Participation &amp; Mastery
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categoryEntries.map(([cat, data]) => (
              <div key={cat} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 capitalize">
                    {cat.toLowerCase().replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-black text-indigo-700">{data.averageScore}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, data.averageScore)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  {data.sessionsCount} {data.sessionsCount === 1 ? 'session' : 'sessions'} completed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Columns: Collective Strengths vs Areas for Institutional Intervention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Institutional Student Strengths
          </h4>
          {report.topStrengths.length === 0 ? (
            <p className="text-xs text-slate-400">Not enough session evaluations yet.</p>
          ) : (
            <div className="space-y-1.5">
              {report.topStrengths.map((str, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 bg-emerald-50/60 rounded-lg text-xs text-emerald-900 border border-emerald-100">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{str}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Common Areas for Curriculum Reinforcement
          </h4>
          {report.topImprovementAreas.length === 0 ? (
            <p className="text-xs text-slate-400">No common deficiency patterns detected.</p>
          ) : (
            <div className="space-y-1.5">
              {report.topImprovementAreas.map((imp, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 bg-amber-50/60 rounded-lg text-xs text-amber-900 border border-amber-100">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{imp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Student Privacy Safeguard Disclaimer */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Student Privacy Safeguard:</strong> All metrics displayed above are strictly aggregate institutional statistics. Individual student interview recordings, answers, and detailed AI evaluations remain private to each student and are never exposed without explicit student consent.
        </p>
      </div>
    </div>
  );
};
