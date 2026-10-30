import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/I18nContext';
import { LanguageSelector } from '../common/LanguageSelector';
import {
  AdminDashboardMetrics,
  SafeUser,
  EmployerCompanyProfileData,
  ModerationItemData,
  ModerationItemStatus,
  PlatformAnalyticsReport,
  AuditLogEntry,
  AdminSystemHealthReport,
} from '../../types';
import {
  fetchAdminDashboardMetricsApi,
  fetchAdminUsersApi,
  suspendUserApi,
  reactivateUserApi,
  fetchPendingEmployersApi,
  verifyEmployerApi,
  rejectEmployerApi,
  fetchAdminCollegesApi,
  verifyCollegeApi,
  fetchModerationItemsApi,
  reviewModerationItemApi,
  fetchPlatformAnalyticsApi,
  fetchAuditLogsApi,
  fetchAdminSystemHealthApi,
} from '../../services/api';
import { AdminMetricsCards } from './AdminMetricsCards';
import { AdminUserManagementTable } from './AdminUserManagementTable';
import { AdminEmployerVerificationTable } from './AdminEmployerVerificationTable';
import { AdminCollegeManagementTable } from './AdminCollegeManagementTable';
import { AdminContentModerationTable } from './AdminContentModerationTable';
import { AdminAnalyticsCharts } from './AdminAnalyticsCharts';
import { AdminAuditLogsTable } from './AdminAuditLogsTable';
import { AdminSystemHealthCard } from './AdminSystemHealthCard';
import { AdminWhatsAppControlCard } from './AdminWhatsAppControlCard';
import { AdminMatchingConfigCard } from './AdminMatchingConfigCard';
import { AdminInterviewQuestionManagementCard } from './AdminInterviewQuestionManagementCard';
import { AdminMentorVerificationCard } from '../mentorship/AdminMentorVerificationCard';
import { AdminLearningManagementCard } from '../learning/AdminLearningManagementCard';
import { AdminPlatformAnalyticsDashboard } from '../analytics/AdminPlatformAnalyticsDashboard';
import {
  ShieldAlert,
  Users,
  Building2,
  GraduationCap,
  TrendingUp,
  FileText,
  Activity,
  LayoutDashboard,
  RefreshCw,
  Clock,
  ShieldCheck,
  MessageSquare,
  Sliders,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

type AdminTab =
  | 'overview'
  | 'users'
  | 'employers'
  | 'colleges'
  | 'moderation'
  | 'analytics'
  | 'audit-logs'
  | 'system-health'
  | 'whatsapp'
  | 'matching'
  | 'interviews'
  | 'mentorship'
  | 'learning';

export const AdminControlCentreView: React.FC = () => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [notice, setNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Data states
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Users state
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [userPagination, setUserPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userFilters, setUserFilters] = useState<{ role?: string; status?: string; search?: string }>({});

  // Pending Employers state
  const [pendingEmployers, setPendingEmployers] = useState<EmployerCompanyProfileData[]>([]);
  const [loadingEmployers, setLoadingEmployers] = useState(false);

  // Colleges state
  const [colleges, setColleges] = useState<Array<SafeUser & { stats?: { cohortCount: number; driveCount: number } }>>([]);
  const [loadingColleges, setLoadingColleges] = useState(false);

  // Moderation state
  const [moderationItems, setModerationItems] = useState<ModerationItemData[]>([]);
  const [loadingModeration, setLoadingModeration] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<PlatformAnalyticsReport | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditPagination, setAuditPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilters, setAuditFilters] = useState<{ action?: string; resourceType?: string }>({});

  // System Health state
  const [systemHealth, setSystemHealth] = useState<AdminSystemHealthReport | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Notice helper
  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 4000);
  };

  // 1. Fetch Overview Metrics
  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    const res = await fetchAdminDashboardMetricsApi(token);
    if (res.success && res.data) {
      setMetrics(res.data);
    }
    setLoadingMetrics(false);
  }, [token]);

  // 2. Fetch Users
  const loadUsers = useCallback(
    async (page: number = 1, filters = userFilters) => {
      setLoadingUsers(true);
      const res = await fetchAdminUsersApi({ ...filters, page, limit: 20 }, token);
      if (res.success && res.data) {
        setUsers(res.data.users);
        setUserPagination(res.data.pagination);
      }
      setLoadingUsers(false);
    },
    [token, userFilters]
  );

  // 3. Fetch Pending Employers
  const loadPendingEmployers = useCallback(async () => {
    setLoadingEmployers(true);
    const res = await fetchPendingEmployersApi(token);
    if (res.success && res.data) {
      setPendingEmployers(res.data.employers);
    }
    setLoadingEmployers(false);
  }, [token]);

  // 4. Fetch Colleges
  const loadColleges = useCallback(async () => {
    setLoadingColleges(true);
    const res = await fetchAdminCollegesApi(token);
    if (res.success && res.data) {
      setColleges(res.data.colleges);
    }
    setLoadingColleges(false);
  }, [token]);

  // 5. Fetch Moderation Items
  const loadModeration = useCallback(async () => {
    setLoadingModeration(true);
    const res = await fetchModerationItemsApi(undefined, token);
    if (res.success && res.data) {
      setModerationItems(res.data.items);
    }
    setLoadingModeration(false);
  }, [token]);

  // 6. Fetch Analytics
  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    const res = await fetchPlatformAnalyticsApi(token);
    if (res.success && res.data) {
      setAnalytics(res.data);
    }
    setLoadingAnalytics(false);
  }, [token]);

  // 7. Fetch Audit Logs
  const loadAuditLogs = useCallback(
    async (page: number = 1, filters = auditFilters) => {
      setLoadingAudit(true);
      const res = await fetchAuditLogsApi({ ...filters, page, limit: 20 }, token);
      if (res.success && res.data) {
        setAuditLogs(res.data.logs);
        setAuditPagination(res.data.pagination);
      }
      setLoadingAudit(false);
    },
    [token, auditFilters]
  );

  // 8. Fetch System Health
  const loadHealth = useCallback(async () => {
    setLoadingHealth(true);
    const res = await fetchAdminSystemHealthApi(token);
    if (res.success && res.data) {
      setSystemHealth(res.data);
    }
    setLoadingHealth(false);
  }, [token]);

  // Trigger loads based on active tab
  useEffect(() => {
    if (activeTab === 'overview') {
      loadMetrics();
    } else if (activeTab === 'users') {
      loadUsers(1);
    } else if (activeTab === 'employers') {
      loadPendingEmployers();
    } else if (activeTab === 'colleges') {
      loadColleges();
    } else if (activeTab === 'moderation') {
      loadModeration();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    } else if (activeTab === 'audit-logs') {
      loadAuditLogs(1);
    } else if (activeTab === 'system-health') {
      loadHealth();
    }
  }, [
    activeTab,
    loadMetrics,
    loadUsers,
    loadPendingEmployers,
    loadColleges,
    loadModeration,
    loadAnalytics,
    loadAuditLogs,
    loadHealth,
  ]);

  // Handlers for User Actions
  const handleSuspendUser = async (userId: string, reason: string): Promise<boolean> => {
    const res = await suspendUserApi(userId, reason, token);
    if (res.success) {
      showNotice(res.data?.message || 'User suspended successfully.');
      loadUsers(userPagination.page);
      return true;
    }
    showNotice(res.error?.message || 'Failed to suspend user.', 'error');
    return false;
  };

  const handleReactivateUser = async (userId: string): Promise<boolean> => {
    const res = await reactivateUserApi(userId, token);
    if (res.success) {
      showNotice(res.data?.message || 'User reactivated successfully.');
      loadUsers(userPagination.page);
      return true;
    }
    showNotice(res.error?.message || 'Failed to reactivate user.', 'error');
    return false;
  };

  // Handlers for Employer Actions
  const handleVerifyEmployer = async (employerId: string, notes?: string): Promise<boolean> => {
    const res = await verifyEmployerApi(employerId, notes, token);
    if (res.success) {
      showNotice('Employer corporate profile verified.');
      loadPendingEmployers();
      return true;
    }
    showNotice(res.error?.message || 'Verification failed.', 'error');
    return false;
  };

  const handleRejectEmployer = async (employerId: string, reason: string): Promise<boolean> => {
    const res = await rejectEmployerApi(employerId, reason, token);
    if (res.success) {
      showNotice('Employer registration rejected.');
      loadPendingEmployers();
      return true;
    }
    showNotice(res.error?.message || 'Rejection failed.', 'error');
    return false;
  };

  // Handlers for College Actions
  const handleVerifyCollege = async (collegeId: string): Promise<boolean> => {
    const res = await verifyCollegeApi(collegeId, token);
    if (res.success) {
      showNotice('College institutional credentials verified.');
      loadColleges();
      return true;
    }
    showNotice(res.error?.message || 'College verification failed.', 'error');
    return false;
  };

  // Handlers for Moderation Actions
  const handleReviewModerationItem = async (
    id: string,
    status: ModerationItemStatus,
    notes?: string
  ): Promise<boolean> => {
    const res = await reviewModerationItemApi(id, { status, notes }, token);
    if (res.success) {
      showNotice('Moderation review resolved.');
      loadModeration();
      return true;
    }
    showNotice(res.error?.message || 'Review failed.', 'error');
    return false;
  };

  const tabs: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Governance', icon: Users },
    { id: 'employers', label: 'Employer Verification', icon: Building2 },
    { id: 'colleges', label: 'College Supervision', icon: GraduationCap },
    { id: 'moderation', label: 'Content Moderation', icon: ShieldAlert },
    { id: 'analytics', label: 'Placement Analytics', icon: TrendingUp },
    { id: 'audit-logs', label: 'Audit Trail', icon: FileText },
    { id: 'system-health', label: 'System Health', icon: Activity },
    { id: 'whatsapp', label: 'WhatsApp Integration', icon: MessageSquare },
    { id: 'matching', label: 'Matching Weights', icon: Sliders },
    { id: 'interviews', label: 'Interview Bank', icon: HelpCircle },
    { id: 'mentorship', label: 'Mentor Verification', icon: ShieldCheck },
    { id: 'learning', label: 'Learning & Quality', icon: BookOpen },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Platform Governance Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Platform Governance & Oversight · Phase 9
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Admin Control Centre
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Supervise recruitment drives, verify employers and colleges, protect student interests, and uphold transparent placement disclosures for Colleges with No Placement Cell.
          </p>
        </div>
        <div className="relative z-10 flex-shrink-0">
          <LanguageSelector variant="compact" />
        </div>

        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Floating Notice Toast */}
      {notice && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium transition-all ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {notice.message}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <AdminMetricsCards metrics={metrics} loading={loadingMetrics} />

          {/* Recent Platform Activity */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> Recent Administrative Activity
              </h3>
              <button
                type="button"
                onClick={loadMetrics}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            {loadingMetrics ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading recent activities...</div>
            ) : !metrics || metrics.recentActivities.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No administrative activities recorded yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {metrics.recentActivities.map((act) => (
                  <div key={act.id} className="py-2.5 flex items-center justify-between text-xs gap-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{act.action}</span>
                      <span className="text-slate-500">on {act.resourceType}</span>
                      {act.reason && <span className="text-slate-400 truncate max-w-sm">("{act.reason}")</span>}
                    </div>
                    <div className="text-slate-400 whitespace-nowrap">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <AdminUserManagementTable
          users={users}
          totalUsers={userPagination.total}
          currentPage={userPagination.page}
          totalPages={userPagination.totalPages}
          currentUserId={user?.id}
          loading={loadingUsers}
          onPageChange={(page) => loadUsers(page)}
          onFilterRole={(role) => {
            const next = { ...userFilters, role: role || undefined };
            setUserFilters(next);
            loadUsers(1, next);
          }}
          onFilterStatus={(status) => {
            const next = { ...userFilters, status: status || undefined };
            setUserFilters(next);
            loadUsers(1, next);
          }}
          onSearch={(query) => {
            const next = { ...userFilters, search: query || undefined };
            setUserFilters(next);
            loadUsers(1, next);
          }}
          onSuspendUser={handleSuspendUser}
          onReactivateUser={handleReactivateUser}
        />
      )}

      {activeTab === 'employers' && (
        <AdminEmployerVerificationTable
          pendingEmployers={pendingEmployers}
          loading={loadingEmployers}
          onVerifyEmployer={handleVerifyEmployer}
          onRejectEmployer={handleRejectEmployer}
        />
      )}

      {activeTab === 'colleges' && (
        <AdminCollegeManagementTable
          colleges={colleges}
          loading={loadingColleges}
          onVerifyCollege={handleVerifyCollege}
        />
      )}

      {activeTab === 'moderation' && (
        <AdminContentModerationTable
          items={moderationItems}
          loading={loadingModeration}
          onReviewItem={handleReviewModerationItem}
        />
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <AdminPlatformAnalyticsDashboard token={token} />
          <AdminAnalyticsCharts analytics={analytics} loading={loadingAnalytics} />
        </div>
      )}

      {activeTab === 'audit-logs' && (
        <AdminAuditLogsTable
          logs={auditLogs}
          totalLogs={auditPagination.total}
          currentPage={auditPagination.page}
          totalPages={auditPagination.totalPages}
          loading={loadingAudit}
          onPageChange={(page) => loadAuditLogs(page)}
          onFilterAction={(action) => {
            const next = { ...auditFilters, action: action || undefined };
            setAuditFilters(next);
            loadAuditLogs(1, next);
          }}
          onFilterResourceType={(resourceType) => {
            const next = { ...auditFilters, resourceType: resourceType || undefined };
            setAuditFilters(next);
            loadAuditLogs(1, next);
          }}
        />
      )}

      {activeTab === 'system-health' && (
        <AdminSystemHealthCard health={systemHealth} loading={loadingHealth} onRefresh={loadHealth} />
      )}

      {activeTab === 'whatsapp' && (
        <AdminWhatsAppControlCard token={token} />
      )}

      {activeTab === 'matching' && (
        <AdminMatchingConfigCard token={token} />
      )}

      {activeTab === 'interviews' && (
        <AdminInterviewQuestionManagementCard token={token} />
      )}

      {activeTab === 'mentorship' && (
        <AdminMentorVerificationCard token={token} />
      )}

      {activeTab === 'learning' && (
        <AdminLearningManagementCard token={token} />
      )}
    </div>
  );
};
