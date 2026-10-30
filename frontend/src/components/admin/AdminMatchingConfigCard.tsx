import React, { useState, useEffect } from 'react';
import { MatchingWeightsConfig } from '../../types';
import {
  fetchMatchingConfigApi,
  updateMatchingConfigApi,
  fetchMatchingAnalyticsApi,
} from '../../services/api';
import {
  Sliders,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Save,
  RotateCcw,
} from 'lucide-react';

interface AdminMatchingConfigCardProps {
  token?: string | null;
}

export const AdminMatchingConfigCard: React.FC<AdminMatchingConfigCardProps> = ({ token }) => {
  const [weights, setWeights] = useState<MatchingWeightsConfig>({
    skills: 35,
    education: 20,
    assessment: 15,
    experience: 10,
    location: 10,
    rolePreference: 10,
  });

  const [analytics, setAnalytics] = useState<{
    totalRecommendationsGenerated: number;
    averageMatchScore: number;
    distribution: {
      excellent: number;
      strong: number;
      moderate: number;
      low: number;
    };
  } | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [configRes, analyticsRes] = await Promise.all([
        fetchMatchingConfigApi(token),
        fetchMatchingAnalyticsApi(token),
      ]);

      if (configRes.success && configRes.data) {
        setWeights(configRes.data.scoringWeights);
      }
      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
    } catch {
      // Ignore background error
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = (key: keyof MatchingWeightsConfig, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(100, isNaN(value) ? 0 : value)),
    }));
    setMessage(null);
  };

  const totalSum =
    (weights.skills || 0) +
    (weights.education || 0) +
    (weights.assessment || 0) +
    (weights.experience || 0) +
    (weights.location || 0) +
    (weights.rolePreference || 0);

  const isValidTotal = Math.round(totalSum) === 100;

  const handleSave = async () => {
    if (!isValidTotal) {
      setMessage({
        text: `Total weights must sum exactly to 100%. Current sum: ${totalSum}%`,
        type: 'error',
      });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const res = await updateMatchingConfigApi(weights, token);
      if (res.success && res.data) {
        setWeights(res.data.scoringWeights);
        setMessage({
          text: 'Matching weights successfully updated across the platform.',
          type: 'success',
        });
      } else {
        setMessage({
          text: res.error?.message || 'Failed to update matching weights.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setMessage({
        text: err instanceof Error ? err.message : 'Error updating weights',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setWeights({
      skills: 35,
      education: 20,
      assessment: 15,
      experience: 10,
      location: 10,
      rolePreference: 10,
    });
    setMessage(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2">
            <Sliders className="w-3.5 h-3.5" />
            Phase 13 Recommendation Configuration
          </div>
          <h3 className="text-lg font-bold text-slate-900">Configurable 6-Pillar Matching Formula</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Adjust the global weights governing student-opportunity compatibility calculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isValidTotal}
            className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 shadow-sm transition"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Weights'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Weights Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* 1. Skills */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Skills Weight (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={weights.skills}
            onChange={(e) => handleWeightChange('skills', parseInt(e.target.value, 10))}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
          />
          <span className="text-[11px] text-slate-500 block">Required &amp; preferred skill fit</span>
        </div>

        {/* 2. Education */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Education Weight (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={weights.education}
            onChange={(e) => handleWeightChange('education', parseInt(e.target.value, 10))}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
          />
          <span className="text-[11px] text-slate-500 block">Course, branch &amp; graduation year</span>
        </div>

        {/* 3. Assessment */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Assessment Readiness (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={weights.assessment}
            onChange={(e) => handleWeightChange('assessment', parseInt(e.target.value, 10))}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
          />
          <span className="text-[11px] text-slate-500 block">Verified assessment readiness</span>
        </div>

        {/* 4. Experience */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Experience &amp; Projects (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={weights.experience}
            onChange={(e) => handleWeightChange('experience', parseInt(e.target.value, 10))}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
          />
          <span className="text-[11px] text-slate-500 block">Projects, certs &amp; internships</span>
        </div>

        {/* 5. Location */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Location Preference (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={weights.location}
            onChange={(e) => handleWeightChange('location', parseInt(e.target.value, 10))}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
          />
          <span className="text-[11px] text-slate-500 block">Work mode &amp; geographic match</span>
        </div>

        {/* 6. Role Preference */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Role Preference (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={weights.rolePreference}
            onChange={(e) => handleWeightChange('rolePreference', parseInt(e.target.value, 10))}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900"
          />
          <span className="text-[11px] text-slate-500 block">Job role title &amp; career interests</span>
        </div>
      </div>

      {/* Sum Indicator */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <span className="font-semibold text-slate-700">Total Formula Weights Sum:</span>
        <span
          className={`px-3 py-1 rounded-full font-bold text-xs ${
            isValidTotal
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-rose-100 text-rose-800 border border-rose-300'
          }`}
        >
          {totalSum}% {isValidTotal ? '(Valid: 100%)' : '(Must Equal Exactly 100%)'}
        </span>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            Matching Engine Analytics
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="block text-lg font-bold text-slate-900">{analytics.averageMatchScore}%</span>
              <span className="text-[11px] text-slate-500">Average Match Score</span>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="block text-lg font-bold text-emerald-700">{analytics.distribution.excellent}</span>
              <span className="text-[11px] text-emerald-600">Excellent (85%+)</span>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
              <span className="block text-lg font-bold text-blue-700">{analytics.distribution.strong}</span>
              <span className="text-[11px] text-blue-600">Strong (70-84%)</span>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
              <span className="block text-lg font-bold text-amber-700">{analytics.distribution.moderate}</span>
              <span className="text-[11px] text-amber-600">Moderate (50-69%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
