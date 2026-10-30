import React, { useState, useEffect } from 'react';
import { CareerReadinessReport } from '../../types';
import { fetchCareerReadinessReportApi } from '../../services/api';

interface CareerReadinessViewProps {
  token?: string | null;
  onNavigateToTab?: (tab: string) => void;
}

export const CareerReadinessView: React.FC<CareerReadinessViewProps> = ({
  token,
  onNavigateToTab,
}) => {
  const [report, setReport] = useState<CareerReadinessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [token]);

  const loadReport = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCareerReadinessReportApi(token);
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setError(res.error?.message || 'Failed to fetch career readiness report');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading readiness report');
    } finally {
      setLoading(false);
    }
  };

  const getBandBadge = (band: string) => {
    switch (band) {
      case 'HIGHLY_JOB_READY':
        return 'bg-emerald-500 text-white shadow-sm';
      case 'JOB_READY':
        return 'bg-blue-600 text-white shadow-sm';
      case 'DEVELOPING':
        return 'bg-amber-500 text-white shadow-sm';
      default:
        return 'bg-slate-500 text-white shadow-sm';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'GOOD':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'NEEDS_WORK':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-medium">Computing your 6-pillar Career Readiness Score...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
        {error || 'Unable to compute career readiness report.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Hero Banner with Score Gauge */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 md:p-8 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Transparent Heuristic Evaluation
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-indigo-300 font-medium">
                {report.assessmentVerifiedSkillsCount} Skills Verified
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Career Readiness Scorecard
            </h2>
            <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
              An explainable composite score calculated directly from your profile completeness,
              standardized assessment outcomes, project portfolio proof, and ATS resume availability.
            </p>
          </div>

          {/* Large Readiness Score Widget */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[200px] shrink-0 space-y-2">
            <span className="block text-5xl font-black tracking-tight text-white">
              {report.overallScore}%
            </span>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold tracking-wider uppercase ${getBandBadge(
                report.statusBand
              )}`}
            >
              {report.statusBand.replace(/_/g, ' ')}
            </span>
            <span className="text-[11px] text-slate-300 block">
              Scale: 0 (Early) to 100 (Job Ready)
            </span>
          </div>
        </div>
      </div>

      {/* 6 Explainable Pillars Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h3 className="font-bold text-slate-900 text-base">
            6-Pillar Heuristic Weighting Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Every point is deterministically awarded based on validated records—no hidden algorithmic opacity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {report.factors.map((f, idx) => {
            const pct = Math.round((f.score / f.maxScore) * 100);
            return (
              <div
                key={idx}
                className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="font-bold text-slate-900 text-sm">{f.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 ${getStatusBadge(
                        f.status
                      )}`}
                    >
                      {f.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                    <span>
                      Pillar Weight: <strong>{f.weight}%</strong>
                    </span>
                    <span className="text-indigo-600 font-bold">
                      {f.score} / {f.maxScore} pts
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{f.details}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actionable Next Steps & Missing Factors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Missing Factors */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
              !
            </div>
            <h3 className="font-bold text-slate-900 text-base">Identified Score Gaps</h3>
          </div>

          {report.missingFactors.length === 0 ? (
            <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl font-medium">
              Excellent! No score gaps detected. All 6 pillars are satisfied.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {report.missingFactors.map((mf, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2.5 font-medium leading-relaxed"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  <span>{mf}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Improvement Suggestions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              ★
            </div>
            <h3 className="font-bold text-slate-900 text-base">Actionable Recommendations</h3>
          </div>

          {report.improvementSuggestions.length === 0 ? (
            <p className="text-xs text-slate-500">Your profile is currently maximized.</p>
          ) : (
            <div className="space-y-2.5">
              {report.improvementSuggestions.map((sug, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-900 flex items-start gap-2.5 font-medium leading-relaxed"
                >
                  <span className="text-indigo-600 font-bold shrink-0">{idx + 1}.</span>
                  <span>{sug}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Action Navigation */}
          {onNavigateToTab && (
            <div className="pt-2 flex flex-wrap gap-2">
              <button
                onClick={() => onNavigateToTab('assessments')}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Take Skill Assessments →
              </button>
              <button
                onClick={() => onNavigateToTab('projects')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Add Projects →
              </button>
              <button
                onClick={() => onNavigateToTab('resumes')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Build Resume →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Official Employment Disclaimer Banner */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <svg
          className="w-5 h-5 text-slate-400 shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="leading-relaxed">
          <strong className="text-slate-700">Official Disclaimer:</strong> {report.disclaimer}
        </p>
      </div>
    </div>
  );
};
