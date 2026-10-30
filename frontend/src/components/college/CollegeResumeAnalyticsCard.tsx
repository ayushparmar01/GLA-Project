import React, { useState, useEffect } from 'react';
import { CollegeResumeAnalyticsReport } from '../../types';
import { fetchCollegeResumeAnalyticsApi } from '../../services/api';
import {
  FileText,
  Users,
  Award,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface CollegeResumeAnalyticsCardProps {
  token?: string | null;
}

export const CollegeResumeAnalyticsCard: React.FC<CollegeResumeAnalyticsCardProps> = ({
  token,
}) => {
  const [report, setReport] = useState<CollegeResumeAnalyticsReport | null>(null);
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
      const res = await fetchCollegeResumeAnalyticsApi(token);
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setError(res.error?.message || 'Failed to fetch resume analytics.');
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Error fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Aggregating institutional resume readiness intelligence...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>Resume analytics currently unavailable.</span>
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            Phase 15 · Institutional Resume Optimization Analytics
          </div>
          <h3 className="text-lg font-bold text-slate-900">Student Resume Quality &amp; ATS Readiness Trends</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated institutional benchmarks on student ATS compatibility, common keyword gaps, and formatting health.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 self-start sm:self-auto cursor-pointer"
          title="Refresh analytics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Top 3 KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 block flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" /> Participating Students
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {report.totalStudentsUsingAnalyzer}
          </span>
          <span className="text-[11px] text-slate-500">Active in resume optimization</span>
        </div>

        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <span className="text-xs font-semibold text-indigo-700 block flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-indigo-600" /> Average ATS Score
          </span>
          <span className="text-2xl font-black text-indigo-900 mt-1 block">
            {report.averageAtsScore} / 100
          </span>
          <span className="text-[11px] text-indigo-600">
            {report.averageAtsScore >= 75
              ? 'Strong institutional alignment'
              : report.averageAtsScore >= 50
              ? 'Moderate alignment'
              : 'Early stage drafts'}
          </span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <span className="text-xs font-semibold text-emerald-700 block flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Completed Analyses
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            {report.totalAnalysesCompleted}
          </span>
          <span className="text-[11px] text-emerald-600">Total job benchmarks</span>
        </div>
      </div>

      {/* Two Columns: Common Missing Skills vs Common Quality Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Common Missing Skills */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Top Skill Gaps Across Students
          </h4>
          {report.commonMissingSkills.length === 0 ? (
            <p className="text-xs text-slate-400">No common deficiency patterns detected.</p>
          ) : (
            <div className="space-y-1.5">
              {report.commonMissingSkills.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-lg text-xs border border-rose-100"
                >
                  <span className="font-semibold text-rose-900">{item.skill}</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                    {item.count} resumes missing
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Common Quality Issues */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            Common Resume Formatting Issues
          </h4>
          {report.commonQualityIssues.length === 0 ? (
            <p className="text-xs text-slate-400">Resumes adhere to clean layout standards.</p>
          ) : (
            <div className="space-y-1.5">
              {report.commonQualityIssues.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-amber-50/50 rounded-lg text-xs border border-amber-100"
                >
                  <span className="font-medium text-amber-900 truncate max-w-xs">{item.issue}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex-shrink-0">
                    {item.occurrences} occurrences
                  </span>
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
          <strong>Student Privacy Safeguard:</strong> All metrics displayed above are strictly aggregate institutional statistics. Individual student resumes, personal contact info, and private AI improvement notes are never exposed without explicit student consent.
        </p>
      </div>
    </div>
  );
};
