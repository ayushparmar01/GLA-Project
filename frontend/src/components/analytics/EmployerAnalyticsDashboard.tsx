import React, { useState, useEffect } from 'react';
import { EmployerRecruitmentAnalytics, AnalyticsDateFilter } from '../../types';
import { getEmployerAnalyticsApi } from '../../services/api';
import { MetricCard } from './MetricCard';
import { DateRangeFilter } from './DateRangeFilter';
import { AnalyticsFunnel } from './AnalyticsFunnel';
import { ExportButton } from './ExportButton';
import { ReportGeneratorModal } from './ReportGeneratorModal';
import { ScheduledReportsModal } from './ScheduledReportsModal';

export interface EmployerAnalyticsDashboardProps {
  token?: string | null;
}

export const EmployerAnalyticsDashboard: React.FC<EmployerAnalyticsDashboardProps> = ({ token }) => {
  const [filter, setFilter] = useState<AnalyticsDateFilter>({ preset: '30D' });
  const [data, setData] = useState<EmployerRecruitmentAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchAnalytics();
  }, [filter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const res = await getEmployerAnalyticsApi(filter, token);
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
          <p className="mt-2 text-xs font-medium text-gray-500">Loading recruitment analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-gray-700">Recruitment analytics currently unavailable.</p>
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
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              EMPLOYER PORTAL
            </span>
            <h2 className="text-lg font-bold text-gray-900">{data.companyName}</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Hiring pipeline analytics, applicant quality, conversion funnels, and job-level metrics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={filter} onChange={setFilter} />
          <ExportButton onExport={handleQuickExport} label="Export" />
          <button
            type="button"
            onClick={() => setIsScheduleModalOpen(true)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            ⏰ Schedules
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard
          label="Total Jobs Posted"
          value={data.overview.totalJobsPosted}
          subtitle={`${data.overview.activeJobsCount} active openings`}
          variant="default"
        />
        <MetricCard
          label="Applications Received"
          value={data.overview.totalApplicationsReceived}
          subtitle="Direct student submissions"
          variant="primary"
        />
        <MetricCard
          label="Under Review"
          value={data.overview.underReviewCount}
          subtitle="Pending screening"
          variant="warning"
        />
        <MetricCard
          label="Shortlisted"
          value={data.overview.shortlistedCount}
          subtitle="Passed resume screening"
          variant="purple"
        />
        <MetricCard
          label="Interviews"
          value={data.overview.interviewCount}
          subtitle="Conducted or scheduled"
          variant="primary"
        />
        <MetricCard
          label="Final Offers"
          value={data.overview.finalSelectionsCount}
          subtitle="Offers extended"
          badge="Verified"
          variant="success"
        />
      </div>

      {/* Recruitment Funnel & Status Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnalyticsFunnel
          title="Recruitment Pipeline Funnel"
          subtitle="From candidate discovery to accepted job offers"
          stages={data.recruitmentFunnel}
          countingUnit="APPLICATIONS"
        />

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Application Status Distribution</h3>
          <p className="text-xs text-gray-500">Overall status breakdown across all company openings</p>

          <div className="mt-5 space-y-3.5">
            {data.statusDistribution.map((item) => (
              <div key={item.status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">{item.status.replace(/_/g, ' ')}</span>
                  <span className="text-gray-900 font-bold">
                    {item.count} <span className="text-gray-400 font-normal">({item.percentage}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      item.status === 'SELECTED'
                        ? 'bg-emerald-500'
                        : item.status === 'SHORTLISTED' || item.status === 'INTERVIEW_SCHEDULED'
                        ? 'bg-blue-500'
                        : item.status === 'REJECTED'
                        ? 'bg-rose-400'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-Job Performance Table */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900">Active Job Performance Breakdown</h3>
        <p className="text-xs text-gray-500">Individual metrics for each job posting in period</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="pb-2 font-semibold">Job Title</th>
                <th className="pb-2 font-semibold">Status</th>
                <th className="pb-2 text-right font-semibold">Applications</th>
                <th className="pb-2 text-right font-semibold">Eligible</th>
                <th className="pb-2 text-right font-semibold">Shortlisted</th>
                <th className="pb-2 text-right font-semibold">Interviewed</th>
                <th className="pb-2 text-right font-semibold">Selected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.jobPerformance.map((job) => (
                <tr key={job.driveId} className="hover:bg-gray-50/50">
                  <td className="py-2.5 font-medium text-gray-900">{job.title}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        job.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-gray-800">{job.applicationsCount}</td>
                  <td className="py-2.5 text-right text-gray-600">{job.eligibleCount}</td>
                  <td className="py-2.5 text-right text-purple-700 font-semibold">{job.shortlistedCount}</td>
                  <td className="py-2.5 text-right text-blue-700 font-semibold">{job.interviewCount}</td>
                  <td className="py-2.5 text-right font-bold text-emerald-600">{job.selectedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Generator Modal */}
      <ReportGeneratorModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        scopeType="EMPLOYER"
        scopeId={data.employerId}
        defaultTitle={`Recruitment Report - ${data.companyName}`}
        token={token}
      />

      {/* Scheduled Reports Modal */}
      <ScheduledReportsModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        scopeType="EMPLOYER"
        scopeId={data.employerId}
        token={token}
      />
    </div>
  );
};
