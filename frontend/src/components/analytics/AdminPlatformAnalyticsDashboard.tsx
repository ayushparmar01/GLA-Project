import React, { useState, useEffect } from 'react';
import { AdminPlatformAnalytics, AnalyticsDateFilter } from '../../types';
import { getAdminAnalyticsApi } from '../../services/api';
import { MetricCard } from './MetricCard';
import { DateRangeFilter } from './DateRangeFilter';
import { ExportButton } from './ExportButton';
import { ReportGeneratorModal } from './ReportGeneratorModal';
import { ScheduledReportsModal } from './ScheduledReportsModal';

export interface AdminPlatformAnalyticsDashboardProps {
  token?: string | null;
}

export const AdminPlatformAnalyticsDashboard: React.FC<AdminPlatformAnalyticsDashboardProps> = ({ token }) => {
  const [filter, setFilter] = useState<AnalyticsDateFilter>({ preset: '30D' });
  const [data, setData] = useState<AdminPlatformAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchAnalytics();
  }, [filter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const res = await getAdminAnalyticsApi(filter, token);
    if (res.success && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  const handleQuickExport = () => {
    setIsExportModalOpen(true);
  };

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
          <p className="mt-2 text-xs font-medium text-gray-500">Loading platform governance telemetry...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-gray-700">Platform analytics currently unavailable.</p>
        <button
          type="button"
          onClick={fetchAnalytics}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
              PLATFORM GOVERNANCE
            </span>
            <h2 className="text-lg font-bold text-gray-900">CareerBridge Platform Intelligence & Telemetry</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Cross-tenant aggregates, ecosystem growth, recruitment telemetry, and system reliability
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={filter} onChange={setFilter} />
          <ExportButton onExport={handleQuickExport} label="Export Platform Report" />
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ⏰ Automated Digests
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard
          label="Total Students"
          value={data.platformOverview.totalStudents.toLocaleString()}
          subtitle="Registered accounts"
          variant="default"
        />
        <MetricCard
          label="Partner Colleges"
          value={data.platformOverview.totalColleges}
          subtitle="Verified institutions"
          variant="primary"
        />
        <MetricCard
          label="Active Employers"
          value={data.platformOverview.totalEmployers}
          subtitle="Hiring organizations"
          variant="purple"
        />
        <MetricCard
          label="Placement Drives"
          value={data.platformOverview.totalPlacementDrives}
          subtitle="Open & active opportunities"
          variant="default"
        />
        <MetricCard
          label="Total Applications"
          value={data.platformOverview.totalApplications.toLocaleString()}
          subtitle="Platform-wide volume"
          variant="warning"
        />
        <MetricCard
          label="Verified Offers"
          value={data.recruitmentOverview.totalVerifiedSelections.toLocaleString()}
          subtitle="Confirmed outcomes"
          badge="Verified"
          variant="success"
        />
      </div>

      {/* Feature Engagement & System Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Feature Engagement */}
        <div className="col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Platform Feature Engagement</h3>
          <p className="text-xs text-gray-500">Cross-module student participation metrics</p>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5 text-center">
            <div className="rounded-lg bg-blue-50/60 p-3">
              <span className="text-xl font-extrabold text-blue-700">
                {data.platformEngagement.featureEngagement.learningHub.toLocaleString()}
              </span>
              <p className="mt-1 text-xs font-medium text-gray-600">Learning Hub</p>
              <p className="text-[10px] text-gray-400">Path enrollments</p>
            </div>
            <div className="rounded-lg bg-indigo-50/60 p-3">
              <span className="text-xl font-extrabold text-indigo-700">
                {data.platformEngagement.featureEngagement.assessments.toLocaleString()}
              </span>
              <p className="mt-1 text-xs font-medium text-gray-600">Assessments</p>
              <p className="text-[10px] text-gray-400">Tests attempted</p>
            </div>
            <div className="rounded-lg bg-purple-50/60 p-3">
              <span className="text-xl font-extrabold text-purple-700">
                {data.platformEngagement.featureEngagement.resumeAnalyzer.toLocaleString()}
              </span>
              <p className="mt-1 text-xs font-medium text-gray-600">ATS Analyzer</p>
              <p className="text-[10px] text-gray-400">Resumes scored</p>
            </div>
            <div className="rounded-lg bg-sky-50/60 p-3">
              <span className="text-xl font-extrabold text-sky-700">
                {data.platformEngagement.featureEngagement.mockInterviews.toLocaleString()}
              </span>
              <p className="mt-1 text-xs font-medium text-gray-600">Mock AI</p>
              <p className="text-[10px] text-gray-400">Interviews held</p>
            </div>
            <div className="rounded-lg bg-emerald-50/60 p-3">
              <span className="text-xl font-extrabold text-emerald-700">
                {data.platformEngagement.featureEngagement.mentorship.toLocaleString()}
              </span>
              <p className="mt-1 text-xs font-medium text-gray-600">Mentorship</p>
              <p className="text-[10px] text-gray-400">Sessions done</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-600">
            <span>DAU: <strong>{data.platformEngagement.dailyActiveUsers}</strong></span>
            <span>WAU: <strong>{data.platformEngagement.weeklyActiveUsers}</strong></span>
            <span>MAU: <strong>{data.platformEngagement.monthlyActiveUsers}</strong></span>
            <span className="text-emerald-600 font-semibold">Active User Ratio: 78.4%</span>
          </div>
        </div>

        {/* System Health Telemetry */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">System Telemetry & Health</h3>
          <p className="text-xs text-gray-500">Live operational status and service indicators</p>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5 text-xs">
              <span className="text-gray-600 font-medium">Service Status</span>
              <span
                className={`font-bold ${
                  data.systemHealthTelemetry.status === 'OPERATIONAL'
                    ? 'text-green-600'
                    : 'text-amber-600'
                }`}
              >
                ● {data.systemHealthTelemetry.status}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5 text-xs">
              <span className="text-gray-600 font-medium">Database Cluster</span>
              <span className="font-semibold text-gray-800">
                {data.systemHealthTelemetry.databaseStatus}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5 text-xs">
              <span className="text-gray-600 font-medium">Average Latency</span>
              <span className="font-bold text-blue-600">
                {data.systemHealthTelemetry.averageLatencyMs} ms
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5 text-xs">
              <span className="text-gray-600 font-medium">Error Rate</span>
              <span className="font-semibold text-emerald-600">
                {data.systemHealthTelemetry.errorRatePercentage}%
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5 text-xs">
              <span className="text-gray-600 font-medium">Data Integrity</span>
              <span className="font-semibold text-blue-700">
                {data.dataQualityOverview.healthyRecordsPercentage}% healthy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Employers & Top Participating Colleges */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Employers */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Leading Hiring Employers</h3>
          <p className="text-xs text-gray-500">Organizations with highest recruitment engagement</p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="pb-2 font-semibold">Employer</th>
                  <th className="pb-2 text-right font-semibold">Drives</th>
                  <th className="pb-2 text-right font-semibold">Applications</th>
                  <th className="pb-2 text-right font-semibold">Selections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recruitmentOverview.topHiringEmployers.map((emp) => (
                  <tr key={emp.companyName} className="hover:bg-gray-50/50">
                    <td className="py-2.5 font-medium text-gray-800">{emp.companyName}</td>
                    <td className="py-2.5 text-right text-gray-600">{emp.drivesCount}</td>
                    <td className="py-2.5 text-right text-gray-600">{emp.applicationsReceived}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600">{emp.selectionsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Colleges */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Top Participating Institutions</h3>
          <p className="text-xs text-gray-500">Colleges with highest student engagement and placements</p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="pb-2 font-semibold">Institution</th>
                  <th className="pb-2 text-right font-semibold">Students</th>
                  <th className="pb-2 text-right font-semibold">Applications</th>
                  <th className="pb-2 text-right font-semibold">Selections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recruitmentOverview.topParticipatingColleges.map((col) => (
                  <tr key={col.collegeName} className="hover:bg-gray-50/50">
                    <td className="py-2.5 font-medium text-gray-800">{col.collegeName}</td>
                    <td className="py-2.5 text-right text-gray-600">{col.studentsCount}</td>
                    <td className="py-2.5 text-right text-gray-600">{col.applicationsCount}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600">{col.selectionsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Generator Modal */}
      <ReportGeneratorModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        scopeType="ADMIN"
        scopeId="platform-admin"
        defaultTitle="Platform-Wide Analytics & Governance Report"
        token={token}
      />

      {/* Scheduled Reports Modal */}
      <ScheduledReportsModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        scopeType="ADMIN"
        scopeId="platform-admin"
        token={token}
      />
    </div>
  );
};
