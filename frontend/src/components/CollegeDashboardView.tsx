import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/I18nContext';
import { LanguageSelector } from './common/LanguageSelector';
import {
  fetchCollegeStatsApi,
  fetchCollegeIncomingConnectionsApi,
  respondToConnectionApi,
  blockConnectionApi,
} from '../services/api';
import { CollegeStatsData, CollegeEmployerConnectionData } from '../types';
import { CollegePlacementIntelligenceCard } from './college/CollegePlacementIntelligenceCard';
import { CollegeInterviewReadinessCard } from './college/CollegeInterviewReadinessCard';
import { CollegeResumeAnalyticsCard } from './college/CollegeResumeAnalyticsCard';
import { CollegeMentorshipAnalyticsCard } from './mentorship/CollegeMentorshipAnalyticsCard';
import { CollegeLearningOverviewCard } from './learning/CollegeLearningOverviewCard';
import { CollegeAnalyticsDashboard } from './analytics/CollegeAnalyticsDashboard';
import {
  School,
  Users,
  Briefcase,
  FileCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Building,
  Edit3,
  Calendar,
  CheckCircle2,
  Building2,
  X,
  Check,
  Ban,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface CollegeDashboardViewProps {
  onNavigateToCohorts: () => void;
  onNavigateToDrives: () => void;
  onEditProfile: () => void;
}

export const CollegeDashboardView: React.FC<CollegeDashboardViewProps> = ({
  onNavigateToCohorts,
  onNavigateToDrives,
  onEditProfile,
}) => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<CollegeStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Recruiter Connections State (Phase 4)
  const [connections, setConnections] = useState<CollegeEmployerConnectionData[]>([]);
  const [showConnectionsModal, setShowConnectionsModal] = useState<boolean>(false);
  const [loadingConnections, setLoadingConnections] = useState<boolean>(false);
  const [connectionActionId, setConnectionActionId] = useState<string | null>(null);
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetchCollegeStatsApi(token);
    if (res.success && res.data) {
      setStats(res.data);
    } else {
      setError(res.error?.message || 'Failed to fetch institutional placement statistics.');
    }
    setLoading(false);
  }, [token]);

  const loadConnections = useCallback(async () => {
    if (!user) return;
    setLoadingConnections(true);
    const res = await fetchCollegeIncomingConnectionsApi(user.id, token);
    if (res.success && res.data) {
      setConnections(res.data);
    }
    setLoadingConnections(false);
  }, [user, token]);

  const handleRespondConnection = async (connectionId: string, status: 'ACCEPTED' | 'REJECTED') => {
    setConnectionActionId(connectionId);
    setConnectionMessage(null);
    const res = await respondToConnectionApi(connectionId, status, token);
    if (res.success) {
      setConnectionMessage(`Connection request marked as ${status}.`);
      loadConnections();
    }
    setConnectionActionId(null);
  };

  const handleBlockConnection = async (connectionId: string) => {
    if (!window.confirm('Are you sure you want to block this employer from sending connection requests?')) return;
    setConnectionActionId(connectionId);
    const res = await blockConnectionApi(connectionId, token);
    if (res.success) {
      setConnectionMessage('Employer blocked from contacting this institution.');
      loadConnections();
    }
    setConnectionActionId(null);
  };

  useEffect(() => {
    loadStats();
    loadConnections();
  }, [loadStats, loadConnections]);

  const cp = user?.collegeProfile;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* College Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden mb-8 border border-teal-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <School className="w-3.5 h-3.5" />
                <span>INSTITUTIONAL PLACEMENT DESK</span>
              </span>
              <span className="text-xs text-teal-400 font-mono bg-teal-950/80 px-2.5 py-0.5 rounded border border-teal-800">
                Phase 3 Automated Cell
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {cp?.institutionName || user?.fullName || 'College Placement Cell'}
            </h1>
            <p className="text-slate-300 text-sm mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Campus: <strong className="text-white">{cp?.institutionLocation || 'Pan-India'}</strong></span>
              <span>&bull;</span>
              <span>Coordinator: <strong className="text-white">{cp?.contactPerson || user?.fullName}</strong></span>
              <span>&bull;</span>
              <span>Email: <strong className="text-white">{cp?.placementEmail || user?.email}</strong></span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LanguageSelector variant="compact" />
            <button
              onClick={() => setShowConnectionsModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-800/60 hover:bg-teal-700 text-white font-medium text-xs transition-colors border border-teal-600/40 relative"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Recruiter Requests</span>
              {connections.filter((c) => c.status === 'PENDING').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 right-1.5" />
              )}
            </button>
            <button
              onClick={onEditProfile}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-800/60 hover:bg-teal-700 text-white font-medium text-xs transition-colors border border-teal-600/40"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
            <button
              onClick={onNavigateToDrives}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-sm transition-all shadow-md shadow-teal-500/25"
            >
              <Plus className="w-4 h-4" />
              <span>New Placement Drive</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Cohorts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Cohorts</span>
            <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1 font-heading">
            {stats?.totalCohorts ?? 0}
          </div>
          <p className="text-xs text-slate-500 flex items-center space-x-1">
            <span className="text-teal-600 font-semibold">{stats?.activeCohorts ?? 0} active</span>
            <span>academic batches</span>
          </p>
        </div>

        {/* Unique Enrolled Students */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Students</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1 font-heading">
            {stats?.totalStudentsEnrolled ?? 0}
          </div>
          <p className="text-xs text-slate-500">
            Unique verified students in cohorts
          </p>
        </div>

        {/* Placement Drives */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Campus Drives</span>
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1 font-heading">
            {stats?.totalDrives ?? 0}
          </div>
          <p className="text-xs text-slate-500 flex items-center space-x-1">
            <span className="text-emerald-600 font-semibold">{stats?.publishedDrives ?? 0} published</span>
            <span>opportunities</span>
          </p>
        </div>

        {/* Total Applications */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Applications</span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mb-1 font-heading">
            {stats?.totalApplications ?? 0}
          </div>
          <p className="text-xs text-slate-500">
            Total candidate submissions
          </p>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Placement Drives */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <Briefcase className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg">Recent Placement Drives</h3>
              </div>
              <button
                onClick={onNavigateToDrives}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
              >
                <span>View All Drives</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-1 text-teal-600" />
                <span>Loading recent drives...</span>
              </div>
            ) : !stats?.recentDrives || stats.recentDrives.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Briefcase className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-700">No placement drives created yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Post a drive to begin matching students with hiring companies.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentDrives.map((drive) => (
                  <div
                    key={drive.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{drive.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                          {drive.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {drive.organizationName} &bull; Deadline:{' '}
                        {new Date(drive.applicationDeadline).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-200">
                        {drive.applicationCount ?? 0} Applied
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={onNavigateToDrives}
              className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors border border-slate-200 flex items-center justify-center space-x-2"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>Create Placement Drive</span>
            </button>
          </div>
        </div>

        {/* Recent Student Cohorts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <Users className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg">Recent Academic Cohorts</h3>
              </div>
              <button
                onClick={onNavigateToCohorts}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1"
              >
                <span>Manage Cohorts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-1 text-teal-600" />
                <span>Loading recent cohorts...</span>
              </div>
            ) : !stats?.recentCohorts || stats.recentCohorts.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-700">No cohorts organized yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Group students into batches to enable targeted recruitment.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentCohorts.map((cohort) => (
                  <div
                    key={cohort.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{cohort.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {cohort.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cohort.course || 'All Branches'} &bull; Class of {cohort.graduationYear || 'N/A'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                        {cohort.studentCount} Students
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={onNavigateToCohorts}
              className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors border border-slate-200 flex items-center justify-center space-x-2"
            >
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>Create New Cohort</span>
            </button>
          </div>
        </div>
      </div>

      {/* Institutional Placement Intelligence (Phase 13) */}
      <CollegePlacementIntelligenceCard token={token} />

      {/* Institutional Interview Readiness Intelligence (Phase 14) */}
      <CollegeInterviewReadinessCard token={token} />

      {/* Institutional Resume Optimization Intelligence (Phase 15) */}
      <CollegeResumeAnalyticsCard token={token} />

      {/* Institutional Alumni Mentorship Intelligence (Phase 16) */}
      <CollegeMentorshipAnalyticsCard token={token} />

      {/* Institutional Learning Hub Analytics (Phase 17) */}
      <CollegeLearningOverviewCard token={token} />

      {/* Institutional Advanced Placement Analytics & Conversion Funnel (Phase 18) */}
      <div className="mt-8">
        <CollegeAnalyticsDashboard token={token} />
      </div>

      {/* Recruiter Connections Modal (Phase 4) */}
      {showConnectionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-600" />
                  Employer Partnership Requests
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Review and approve recruitment connections from verified company recruiters.
                </p>
              </div>
              <button
                onClick={() => setShowConnectionsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {connectionMessage && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>{connectionMessage}</span>
              </div>
            )}

            {loadingConnections ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                <span>Loading recruiter connection requests...</span>
              </div>
            ) : connections.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-slate-800 font-semibold text-sm">No Connection Requests Received</div>
                <p className="text-slate-500 text-xs max-w-sm mx-auto">
                  When corporate employers and recruiters reach out to partner with your campus, their requests will appear here for review.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {conn.employerName || `Employer ID: ${conn.employerId.slice(0, 8)}...`}
                        </div>
                        <div className="text-xs text-slate-500">
                          Requested on {new Date(conn.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          conn.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : conn.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : conn.status === 'BLOCKED'
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {conn.status}
                      </span>
                    </div>

                    {conn.message && (
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed italic">
                        "{conn.message}"
                      </p>
                    )}

                    {conn.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => handleBlockConnection(conn.id)}
                          disabled={connectionActionId === conn.id}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50 flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" /> Block
                        </button>
                        <button
                          onClick={() => handleRespondConnection(conn.id, 'REJECTED')}
                          disabled={connectionActionId === conn.id}
                          className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold disabled:opacity-50"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleRespondConnection(conn.id, 'ACCEPTED')}
                          disabled={connectionActionId === conn.id}
                          className="px-3 py-1 bg-teal-600 text-white hover:bg-teal-700 rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Accept Connection
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowConnectionsModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
