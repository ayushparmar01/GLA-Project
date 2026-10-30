import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Flag,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  BookOpen,
  Check,
  X,
} from 'lucide-react';
import { ResourceReportData, LearningResourceData } from '../../types';
import {
  fetchAdminLearningReportsApi,
  resolveAdminLearningReportApi,
  verifyAdminLearningResourceApi,
  seedAdminLearningDataApi,
  fetchLearningResourcesApi,
} from '../../services/api';

interface AdminLearningManagementCardProps {
  token?: string | null;
}

export const AdminLearningManagementCard: React.FC<AdminLearningManagementCardProps> = ({
  token,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'REPORTS' | 'VERIFICATION' | 'SEED'>('REPORTS');
  const [reports, setReports] = useState<ResourceReportData[]>([]);
  const [resources, setResources] = useState<LearningResourceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'REPORTS') {
        const res = await fetchAdminLearningReportsApi(token);
        if (res.success && res.data) setReports(res.data);
      } else if (activeSubTab === 'VERIFICATION') {
        const res = await fetchLearningResourcesApi({}, token);
        if (res.success && res.data) setResources(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (
    reportId: string,
    status: 'RESOLVED' | 'DISMISSED'
  ) => {
    try {
      const res = await resolveAdminLearningReportApi(
        reportId,
        { status, adminNotes: `Reviewed and marked ${status.toLowerCase()} by admin.` },
        token
      );
      if (res.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status } : r))
        );
      }
    } catch {
      // Ignore
    }
  };

  const handleUpdateVerification = async (
    resourceId: string,
    status: 'VERIFIED' | 'REJECTED'
  ) => {
    try {
      const res = await verifyAdminLearningResourceApi(
        resourceId,
        { verificationStatus: status },
        token
      );
      if (res.success) {
        setResources((prev) =>
          prev.map((r) =>
            r.id === resourceId ? { ...r, verificationStatus: status } : r
          )
        );
      }
    } catch {
      // Ignore
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await seedAdminLearningDataApi(token);
      if (res.success) {
        setSeedResult(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Learning Hub Administration & Quality Desk
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Content verification, user grievance moderation, and curriculum database hydration.
          </p>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('REPORTS')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'REPORTS'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            User Reports ({reports.filter((r) => r.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveSubTab('VERIFICATION')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'VERIFICATION'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Resource Verification
          </button>
          <button
            onClick={() => setActiveSubTab('SEED')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'SEED'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Database Hydration
          </button>
        </div>
      </div>

      {/* Reports Sub-tab */}
      {activeSubTab === 'REPORTS' && (
        <div className="space-y-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No content quality reports currently pending review.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                      {rep.reason}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        rep.status === 'PENDING' ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      Status: {rep.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                    {rep.details}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 dark:border-slate-700">
                    <span>Resource ID: {rep.resourceId}</span>
                    {rep.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveReport(rep.id, 'RESOLVED')}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Mark Resolved
                        </button>
                        <button
                          onClick={() => handleResolveReport(rep.id, 'DISMISSED')}
                          className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-medium text-[11px] flex items-center gap-1"
                        >
                          <X className="w-3 h-3" /> Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verification Sub-tab */}
      {activeSubTab === 'VERIFICATION' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Audit learning resources for accuracy, genuine links, and quality standards.
          </div>
          <div className="space-y-3">
            {resources.slice(0, 10).map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="truncate mr-4">
                  <span className="font-bold text-slate-900 dark:text-white block truncate">
                    {res.title}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {res.provider} • {res.resourceType} • Status:{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {res.verificationStatus || 'VERIFIED'}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border text-slate-500 hover:text-indigo-600"
                    title="Test Link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {res.verificationStatus !== 'VERIFIED' ? (
                    <button
                      onClick={() => handleUpdateVerification(res.id, 'VERIFIED')}
                      className="px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold text-[11px]"
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateVerification(res.id, 'REJECTED')}
                      className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold text-[11px]"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Database Hydration Sub-tab */}
      {activeSubTab === 'SEED' && (
        <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-center space-y-4">
          <Database className="w-10 h-10 mx-auto text-indigo-600 dark:text-indigo-400" />
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
              Idempotent Seed Content Hydration
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Populates 10 categories, 10 career paths, ordered modules, verified genuine documentation links, and knowledge check quizzes.
            </p>
          </div>

          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {seeding ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Hydrating Curricula...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Hydrate Curated Content Now
              </>
            )}
          </button>

          {seedResult && (
            <div className="pt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Hydrated: {seedResult.pathsCount} paths, {seedResult.modulesCount} modules,{' '}
              {seedResult.resourcesCount} resources, {seedResult.quizzesCount} quizzes.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
