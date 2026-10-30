import React, { useState, useEffect } from 'react';
import { StudentInterviewAnalytics } from '../../types';
import { fetchStudentInterviewAnalyticsApi } from '../../services/api';
import {
  BarChart3,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Target,
  BrainCircuit,
} from 'lucide-react';

interface InterviewAnalyticsViewProps {
  token: string | null;
  onPracticeTopic?: (topic: string) => void;
}

export const InterviewAnalyticsView: React.FC<InterviewAnalyticsViewProps> = ({
  token,
  onPracticeTopic,
}) => {
  const [analytics, setAnalytics] = useState<StudentInterviewAnalytics | null>(null);
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
      const res = await fetchStudentInterviewAnalyticsApi(token);
      if (res.success && res.data) {
        setAnalytics(res.data);
      } else {
        setError(res.error?.message || 'Failed to load interview analytics.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Computing interview performance analytics...</p>
      </div>
    );
  }

  if (error || !analytics || analytics.totalSessions === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-semibold text-slate-800">No Interview Performance Data Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Complete your first mock interview to view category benchmarks, topic mastery indicators, and chronological score trends.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{analytics.completedSessions}</span>
          <span className="text-[10px] text-slate-500">out of {analytics.totalSessions} sessions</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Average Score</span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">{analytics.averageScore}%</span>
          <span className="text-[10px] text-slate-500">across all evaluations</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Top Category</span>
          <span className="text-sm font-bold text-emerald-700 mt-1.5 block truncate">
            {analytics.strongestCategory}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Highest average fit</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Needs Practice</span>
          <span className="text-sm font-bold text-amber-700 mt-1.5 block truncate">
            {analytics.weakestCategory}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Recommended focus</span>
        </div>
      </div>

      {/* Two columns: Category Breakdown & Topic Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Performance Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              Category Performance
            </h4>
            <span className="text-[11px] text-slate-400">Average Scores</span>
          </div>

          <div className="space-y-3 text-xs">
            {analytics.categoryBreakdown.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>{cat.category.replace('_', ' ')}</span>
                  <span>{cat.averageScore}% ({cat.sessionCount} sessions)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      cat.averageScore >= 80 ? 'bg-emerald-500' : cat.averageScore >= 60 ? 'bg-indigo-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${cat.averageScore}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-600" />
              Topic Strengths &amp; Practice Areas
            </h4>
            <span className="text-[11px] text-slate-400">{analytics.topicBreakdown.length} topics</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
            {analytics.topicBreakdown.map((top, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition"
              >
                <div>
                  <span className="font-bold text-slate-800 block">{top.topic}</span>
                  <span className="text-[10px] text-slate-500">{top.questionsCount} questions evaluated</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      top.status === 'STRONG'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {top.averageScore}% • {top.status === 'STRONG' ? 'Strong' : 'Practice'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Historical Score Trend Timeline */}
      {analytics.recentTrend && analytics.recentTrend.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            Chronological Performance Trend
          </h4>
          <div className="flex items-end gap-3 overflow-x-auto pt-4 pb-2 h-36">
            {analytics.recentTrend.map((t, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 min-w-[50px] flex-1">
                <span className="text-[10px] font-bold text-slate-700">{t.score}%</span>
                <div className="w-full bg-slate-100 h-20 rounded-t-lg relative flex items-end">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      t.score >= 80 ? 'bg-emerald-500' : t.score >= 60 ? 'bg-indigo-500' : 'bg-amber-500'
                    }`}
                    style={{ height: `${t.score}%` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400 truncate max-w-[50px]">{t.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
