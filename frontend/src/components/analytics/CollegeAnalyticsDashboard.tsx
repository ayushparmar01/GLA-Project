import React, { useState, useEffect } from 'react';
import { CollegePlacementAnalytics, AnalyticsDateFilter } from '../../types';
import { getCollegeAnalyticsApi } from '../../services/api';
import { MetricCard } from './MetricCard';
import { DateRangeFilter } from './DateRangeFilter';
import { AnalyticsFunnel } from './AnalyticsFunnel';
import { SkillGapChart } from './SkillGapChart';
import { ExportButton } from './ExportButton';
import { ReportGeneratorModal } from './ReportGeneratorModal';
import { ScheduledReportsModal } from './ScheduledReportsModal';

export interface CollegeAnalyticsDashboardProps {
  token?: string | null;
  onNavigateToLearning?: (pathId?: string) => void;
}

export const CollegeAnalyticsDashboard: React.FC<CollegeAnalyticsDashboardProps> = ({
  token,
  onNavigateToLearning,
}) => {
  const [filter, setFilter] = useState<AnalyticsDateFilter>({ preset: '30D' });
  const [data, setData] = useState<CollegePlacementAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchAnalytics();
  }, [filter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const res = await getCollegeAnalyticsApi(filter, token);
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
          <p className="mt-2 text-xs font-medium text-gray-500">Loading institutional placement analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-gray-700">Institutional analytics currently unavailable.</p>
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
      {/* Institution Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">COLLEGE SCOPE</span>
            <h2 className="text-lg font-bold text-gray-900">{data.collegeName}</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Institutional placement intelligence, conversion funnel, verified outcomes, and skill interventions
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
            ⏰ Scheduled Reports
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard
          label="Registered Students"
          value={data.institutionOverview.totalRegisteredStudents}
          subtitle="Enrolled cohort size"
          variant="default"
        />
        <MetricCard
          label="Active Participating"
          value={data.placementMetrics.totalAppliedStudents}
          subtitle="Applied to at least 1 job"
          variant="primary"
        />
        <MetricCard
          label="Placement Drives"
          value={data.institutionOverview.activeOpportunitiesCount}
          subtitle="Active opportunities"
          variant="purple"
        />
        <MetricCard
          label="Total Applications"
          value={data.institutionOverview.totalApplications}
          subtitle="Submitted application records"
          variant="default"
        />
        <MetricCard
          label="Verified Offers"
          value={data.placementMetrics.totalSelectedStudents}
          subtitle="Confirmed selections"
          badge="Verified"
          variant="success"
        />
        <MetricCard
          label="Conversion Rate"
          value={`${data.placementFunnel.overallPlacementRate}%`}
          subtitle="Selected / Applied unique"
          variant="warning"
        />
      </div>

      {/* Conversion Funnel & Skill Gap Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AnalyticsFunnel
          title="Placement Conversion Funnel"
          subtitle="Progression of unique students through institution placement stages"
          stages={data.placementFunnel.stages}
          countingUnit="UNIQUE_STUDENTS"
        />

        <SkillGapChart
          title="Cohort Skill Gap Analysis"
          subtitle="Technical deficiencies identified across cohort with Phase 17 learning pathways"
          missingSkills={data.skillGapAnalytics.topMissingSkills}
          onNavigateToLearning={onNavigateToLearning}
        />
      </div>

      {/* Department Breakdown & Drive Performance */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Department Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Department / Branch Breakdown</h3>
          <p className="text-xs text-gray-500">Placement performance and profile health across academic branches</p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="pb-2 font-semibold">Department</th>
                  <th className="pb-2 text-right font-semibold">Registered</th>
                  <th className="pb-2 text-right font-semibold">Applied</th>
                  <th className="pb-2 text-right font-semibold">Selected</th>
                  <th className="pb-2 text-right font-semibold">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.departmentBreakdown.map((dept) => (
                  <tr key={dept.department} className="hover:bg-gray-50/50">
                    <td className="py-2.5 font-medium text-gray-800">{dept.department}</td>
                    <td className="py-2.5 text-right text-gray-600">{dept.registeredCount}</td>
                    <td className="py-2.5 text-right text-gray-600">{dept.appliedCount}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600">{dept.selectedCount}</td>
                    <td className="py-2.5 text-right text-blue-600 font-semibold">{dept.averageProfileScore}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Company Activity & Drive Reports */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Placement Drive Performance</h3>
          <p className="text-xs text-gray-500">Applications, shortlists, and verified offers by drive</p>

          <div className="mt-4 space-y-3">
            {data.placementDriveReports.slice(0, 5).map((drive) => (
              <div
                key={drive.driveId}
                className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">{drive.title}</span>
                  <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">
                    {drive.status}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px] mt-0.5">{drive.companyName}</p>

                <div className="mt-2 flex items-center justify-between border-t border-gray-200/60 pt-2 text-[11px]">
                  <span>Applied: <strong>{drive.applicationsCount}</strong></span>
                  <span>Shortlisted: <strong>{drive.shortlistedCount}</strong></span>
                  <span>Interviewed: <strong>{drive.interviewedCount}</strong></span>
                  <span className="text-emerald-700 font-bold">Selected: {drive.selectedCount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Quality & Integrity Audit */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
          Institutional Governance & Data Integrity Audit
        </h4>
        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-blue-800 sm:grid-cols-3">
          <div>
            • Incomplete Profiles: <strong>{data.dataQualityAudit.incompleteProfilesCount}</strong> students
          </div>
          <div>
            • Unassessed Students: <strong>{data.dataQualityAudit.unassessedStudentsCount}</strong> students
          </div>
          <div>
            • Multi-tenant Tenant Isolation: <strong>Strictly Enforced</strong>
          </div>
        </div>
        <div className="mt-3 border-t border-blue-200/60 pt-2 text-[11px] text-blue-700 space-y-1">
          {data.dataQualityAudit.notes.map((note, i) => (
            <p key={i}>✓ {note}</p>
          ))}
        </div>
      </div>

      {/* Report Generator Modal */}
      <ReportGeneratorModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        scopeType="COLLEGE"
        scopeId={data.collegeId}
        defaultTitle={`Institutional Placement Report - ${data.collegeName}`}
        token={token}
      />

      {/* Scheduled Reports Modal */}
      <ScheduledReportsModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        scopeType="COLLEGE"
        scopeId={data.collegeId}
        token={token}
      />
    </div>
  );
};
