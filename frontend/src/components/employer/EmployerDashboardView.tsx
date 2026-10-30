import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/I18nContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { EmployerAnalyticsDashboard } from '../analytics/EmployerAnalyticsDashboard';
import { fetchEmployerDashboardStatsApi } from '../../services/api';
import { EmployerDashboardStatsData } from '../../types';
import {
  Building2,
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  Edit3,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Send,
} from 'lucide-react';

interface EmployerDashboardViewProps {
  onNavigateToOpportunities: () => void;
  onNavigateToApplicants: () => void;
  onNavigateToInterviews: () => void;
  onNavigateToConnections: () => void;
  onNavigateToProfile: () => void;
}

export const EmployerDashboardView: React.FC<EmployerDashboardViewProps> = ({
  onNavigateToOpportunities,
  onNavigateToApplicants,
  onNavigateToInterviews,
  onNavigateToConnections,
  onNavigateToProfile,
}) => {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState<EmployerDashboardStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEmployerDashboardStatsApi(token);
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.error?.message || 'Failed to load employer dashboard metrics.');
      }
    } catch {
      setError('An unexpected error occurred while loading employer dashboard.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const getVerificationBadge = (status?: string, verified?: boolean) => {
    if (verified || status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Employer
        </span>
      );
    }
    if (status === 'REJECTED') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <ShieldAlert className="w-3.5 h-3.5" />
          Verification Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <Clock className="w-3.5 h-3.5" />
        Verification Pending
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                    {user?.employerProfile?.organizationName || user?.fullName || 'Employer Portal'}
                  </h1>
                  {getVerificationBadge(stats?.verificationStatus, stats?.verified)}
                </div>
                <p className="text-slate-400 text-sm mt-0.5">
                  Recruit top engineering and vocational talent from colleges across India.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LanguageSelector variant="compact" />
            <button
              onClick={loadStats}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-slate-700 disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={onNavigateToOpportunities}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Post Opportunity
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        {stats && !stats.verified && stats.verificationStatus === 'PENDING' && (
          <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Profile Verification in Progress: </span>
              Your company profile has been submitted and is currently awaiting approval from partner placement cells. You can still create draft opportunities and connect with colleges.
            </div>
            <button
              onClick={onNavigateToProfile}
              className="text-amber-400 hover:text-amber-300 underline font-medium text-xs whitespace-nowrap"
            >
              View Profile
            </button>
          </div>
        )}

        {/* Profile Completion Bar */}
        {stats && (
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-400 font-medium">Company Profile Strength</span>
              <span className="text-indigo-400 font-bold">{stats.profileCompletionScore}% Completed</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${stats.profileCompletionScore}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadStats}
            className="text-xs underline font-medium text-rose-300 hover:text-rose-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Opportunities</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '—' : stats?.totalOpportunities ?? 0}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">{stats?.publishedOpportunities ?? 0} Published</span>
            <span>•</span>
            <span className="text-slate-500">{stats?.draftOpportunities ?? 0} Drafts</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold">Total Applicants</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '—' : stats?.totalApplications ?? 0}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-blue-400 font-medium">{stats?.shortlistedCandidates ?? 0} Shortlisted</span>
            <span>•</span>
            <span className="text-indigo-400 font-medium">{stats?.interviewStageCandidates ?? 0} Interviewing</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold">Selected Hires</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '—' : stats?.selectedCandidates ?? 0}
          </div>
          <div className="mt-2 text-xs text-emerald-400/80 font-medium">
            Candidates offered and selected
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs uppercase tracking-wider font-semibold">Institutional Network</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            Colleges
          </div>
          <div className="mt-2 text-xs text-amber-400/80 font-medium">
            Connect with rural placement cells
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <button
            onClick={onNavigateToOpportunities}
            className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all group"
          >
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg w-fit group-hover:scale-105 transition-transform mb-3">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="font-semibold text-slate-200 text-sm">Opportunities</div>
            <div className="text-xs text-slate-400 mt-1">Manage job postings</div>
          </button>

          <button
            onClick={onNavigateToApplicants}
            className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all group"
          >
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg w-fit group-hover:scale-105 transition-transform mb-3">
              <Users className="w-5 h-5" />
            </div>
            <div className="font-semibold text-slate-200 text-sm">Candidate Desk</div>
            <div className="text-xs text-slate-400 mt-1">Review applications</div>
          </button>

          <button
            onClick={onNavigateToInterviews}
            className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all group"
          >
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg w-fit group-hover:scale-105 transition-transform mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="font-semibold text-slate-200 text-sm">Interviews</div>
            <div className="text-xs text-slate-400 mt-1">Schedule & meet</div>
          </button>

          <button
            onClick={onNavigateToConnections}
            className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all group"
          >
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg w-fit group-hover:scale-105 transition-transform mb-3">
              <Send className="w-5 h-5" />
            </div>
            <div className="font-semibold text-slate-200 text-sm">Colleges</div>
            <div className="text-xs text-slate-400 mt-1">Recruitment partnerships</div>
          </button>

          <button
            onClick={onNavigateToProfile}
            className="p-4 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all group"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit group-hover:scale-105 transition-transform mb-3">
              <Edit3 className="w-5 h-5" />
            </div>
            <div className="font-semibold text-slate-200 text-sm">Company Profile</div>
            <div className="text-xs text-slate-400 mt-1">Brand & details</div>
          </button>
        </div>
      </div>

      {/* Tables: Recent Opportunities & Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Opportunities */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              Recent Postings
            </h3>
            <button
              onClick={onNavigateToOpportunities}
              className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading opportunities...
            </div>
          ) : !stats?.recentOpportunities || stats.recentOpportunities.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              No recruitment opportunities posted yet.
              <div className="mt-3">
                <button
                  onClick={onNavigateToOpportunities}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Post First Opportunity
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-200 text-sm">{opp.title}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium">
                        {opp.opportunityType}
                      </span>
                      <span>•</span>
                      <span>{opp.workMode}</span>
                      {opp.applicationCount !== undefined && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-400 font-medium">{opp.applicationCount} Applicants</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${
                        opp.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : opp.status === 'DRAFT'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {opp.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Recent Applications
            </h3>
            <button
              onClick={onNavigateToApplicants}
              className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Loading applications...
            </div>
          ) : !stats?.recentApplications || stats.recentApplications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
              No candidate submissions received yet.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-200 text-sm">
                      {app.student?.fullName || 'Candidate'}
                    </div>
                    <div className="text-xs text-slate-400">
                      Applied for <span className="text-slate-300 font-medium">{app.drive?.title || 'Opportunity'}</span>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        app.status === 'SELECTED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : app.status === 'SHORTLISTED'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : app.status === 'INTERVIEW_SCHEDULED'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recruitment Pipeline Intelligence & Advanced Analytics (Phase 18) */}
      <div className="pt-4">
        <EmployerAnalyticsDashboard token={token} />
      </div>
    </div>
  );
};
