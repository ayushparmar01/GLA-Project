import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Layers,
  Award,
  Users,
  CheckCircle,
  TrendingUp,
  BookOpen,
} from 'lucide-react';
import { CollegeLearningAnalyticsReport } from '../../types';
import { fetchCollegeLearningAnalyticsApi } from '../../services/api';

interface CollegeLearningOverviewCardProps {
  token?: string | null;
}

export const CollegeLearningOverviewCard: React.FC<CollegeLearningOverviewCardProps> = ({
  token,
}) => {
  const [report, setReport] = useState<CollegeLearningAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetchCollegeLearningAnalyticsApi(token);
      if (res.success && res.data) {
        setReport(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        Loading college learning metrics...
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Institutional Learning & Skill Development Analytics
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated curriculum progression across all enrolled college students (privacy protected).
          </p>
        </div>

        <span className="text-[11px] font-semibold text-slate-400">
          Generated {new Date(report.generatedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Metric KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Students',
            value: report.totalStudentsActive,
            icon: Users,
            color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50',
          },
          {
            label: 'Total Enrollments',
            value: report.totalEnrollments,
            icon: Layers,
            color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50',
          },
          {
            label: 'Path Completions',
            value: report.totalPathCompletions,
            icon: CheckCircle,
            color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50',
          },
          {
            label: 'Avg Completion Rate',
            value: `${report.averageCompletionRate}%`,
            icon: TrendingUp,
            color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {item.value}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Columns: Top Paths & Top Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Top Enrolled Paths */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            Top Enrolled Learning Paths
          </h4>
          <div className="space-y-2">
            {report.topEnrolledPaths.map((path, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {path.title}
                </span>
                <span className="px-2 py-0.5 rounded-full font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {path.count} students
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Learned Skills */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            Most Popular Technical Skills Learned
          </h4>
          <div className="space-y-2">
            {report.topLearnedSkills.map((sk, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {sk.skill}
                </span>
                <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  {sk.count} learners
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
