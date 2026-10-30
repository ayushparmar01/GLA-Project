import React, { useState, useEffect } from 'react';
import { StudentCareerAnalytics, AnalyticsDateFilter } from '../../types';
import { getStudentAnalyticsApi } from '../../services/api';
import { MetricCard } from './MetricCard';
import { DateRangeFilter } from './DateRangeFilter';
import { ExportButton } from './ExportButton';
import { ReportGeneratorModal } from './ReportGeneratorModal';
import { ScheduledReportsModal } from './ScheduledReportsModal';

export interface StudentAnalyticsDashboardProps {
  token?: string | null;
  onNavigateToLearning?: () => void;
  onNavigateToResume?: () => void;
  onNavigateToInterviews?: () => void;
}

export const StudentAnalyticsDashboard: React.FC<StudentAnalyticsDashboardProps> = ({
  token,
  onNavigateToLearning,
  onNavigateToResume,
  onNavigateToInterviews,
}) => {
  const [filter, setFilter] = useState<AnalyticsDateFilter>({ preset: '30D' });
  const [data, setData] = useState<StudentCareerAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchAnalytics();
  }, [filter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const res = await getStudentAnalyticsApi(filter, token);
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
          <p className="mt-2 text-xs font-medium text-gray-500">Loading career analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-gray-700">Analytics data currently unavailable.</p>
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
      {/* Header with Title, Date Filters and Export */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Career Progress & Readiness Analytics</h2>
          <p className="text-xs text-gray-500">
            Personal performance metrics, verified outcomes, and transparent readiness indicators
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Total Applications"
          value={data.overview.totalApplications}
          subtitle="Submitted in period"
          variant="default"
        />
        <MetricCard
          label="Active In Pipeline"
          value={data.overview.activeApplications}
          subtitle="Review & shortlisting"
          variant="primary"
        />
        <MetricCard
          label="Shortlisted"
          value={data.overview.shortlistedCount}
          subtitle="Advanced to interview"
          variant="purple"
        />
        <MetricCard
          label="Verified Offers"
          value={data.overview.selectedOffersCount}
          subtitle="Status = SELECTED"
          badge="Verified"
          variant="success"
        />
        <MetricCard
          label="Career Readiness"
          value={`${data.readinessIndicators.profileCompletenessScore}%`}
          subtitle="Profile & skills score"
          variant="warning"
        />
      </div>

      {/* Applications Pipeline Breakdown & Readiness Factors */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Application Pipeline */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Applications Status Breakdown</h3>
          <p className="text-xs text-gray-500">Distribution of your submitted applications</p>

          <div className="mt-4 space-y-3">
            {data.overview.statusBreakdown.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400">No applications in this period.</p>
            ) : (
              data.overview.statusBreakdown.map((item) => (
                <div key={item.status} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-700">{item.status.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{item.count}</span>
                    <span className="w-10 text-right text-gray-400">({item.percentage}%)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Career Readiness Breakdown */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Readiness Factors</h3>
          <p className="text-xs text-gray-500">Transparent components of your readiness score</p>

          <div className="mt-4 space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-700">Profile Completeness</span>
                <span className="font-bold text-gray-900">{data.readinessIndicators.profileCompletenessScore}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${data.readinessIndicators.profileCompletenessScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-700">Verified Skills</span>
                <span className="font-bold text-gray-900">{data.readinessIndicators.verifiedSkillsScore}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-indigo-600"
                  style={{ width: `${data.readinessIndicators.verifiedSkillsScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-700">Project Portfolio</span>
                <span className="font-bold text-gray-900">{data.readinessIndicators.projectPortfolioScore}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{ width: `${data.readinessIndicators.projectPortfolioScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium">
                <span className="text-gray-700">ATS Resume Quality</span>
                <span className="font-bold text-gray-900">{data.readinessIndicators.resumeScore}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-purple-600"
                  style={{ width: `${data.readinessIndicators.resumeScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ATS Resume & Keyword Optimization */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">ATS Resume Score</h3>
            {onNavigateToResume && (
              <button
                type="button"
                onClick={onNavigateToResume}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Analyze →
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">Optimization benchmark for automated screeners</p>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-50 text-xl font-extrabold text-purple-700">
              {data.resumeAnalytics.latestScore || 72}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-800">
                {data.resumeAnalytics.latestScore && data.resumeAnalytics.latestScore >= 75
                  ? 'Strong ATS Alignment'
                  : 'Needs Keyword Enhancements'}
              </p>
              <p className="text-[11px] text-gray-400">
                Versions created: {data.resumeAnalytics.versionCount || 1}
              </p>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-semibold text-gray-600">Top Missing Keywords:</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {data.resumeAnalytics.topMissingKeywords.map((kw) => (
                <span
                  key={kw}
                  className="inline-block rounded bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700"
                >
                  +{kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Learning Hub, Skill Assessments & Mock Interviews */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Learning Hub Engagement */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Learning Hub Progress</h3>
            {onNavigateToLearning && (
              <button
                type="button"
                onClick={onNavigateToLearning}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Open Hub →
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">Phase 17 self-paced modules and tracks</p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-gray-50 p-2.5">
              <span className="text-lg font-bold text-gray-900">{data.learningAnalytics.enrolledPathsCount}</span>
              <p className="text-[11px] text-gray-500">Enrolled Paths</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2.5">
              <span className="text-lg font-bold text-gray-900">{data.learningAnalytics.completedModulesCount}</span>
              <p className="text-[11px] text-gray-500">Modules Completed</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2.5">
              <span className="text-lg font-bold text-gray-900">{data.learningAnalytics.averageQuizScore}%</span>
              <p className="text-[11px] text-gray-500">Quiz Average</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-2.5">
              <span className="text-lg font-bold text-gray-900">🔥 {data.learningAnalytics.streakDays}</span>
              <p className="text-[11px] text-gray-500">Day Streak</p>
            </div>
          </div>
        </div>

        {/* Skill Assessments */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900">Skill Assessments</h3>
          <p className="text-xs text-gray-500">Verified technical and cognitive benchmarks</p>

          <div className="mt-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <p className="text-xs font-medium text-gray-600">Tests Completed</p>
              <p className="text-xl font-bold text-gray-900">{data.skillAssessmentAnalytics.totalAttemptsCount}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-600">Average Score</p>
              <p className="text-xl font-bold text-blue-600">{data.skillAssessmentAnalytics.averageScore}%</p>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-semibold text-gray-600">Role Readiness Gaps:</p>
            <div className="mt-1.5 space-y-1.5">
              {data.skillAssessmentAnalytics.roleGaps.slice(0, 3).map((rg) => (
                <div key={rg.skill} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">{rg.skill}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      rg.status === 'VERIFIED'
                        ? 'bg-green-100 text-green-700'
                        : rg.status === 'PRACTICE_NEEDED'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {rg.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Mock Interviews */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">AI Mock Interviews</h3>
            {onNavigateToInterviews && (
              <button
                type="button"
                onClick={onNavigateToInterviews}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Practice →
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500">AI interviewer feedback and rubric evaluation</p>

          <div className="mt-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <p className="text-xs font-medium text-gray-600">Sessions Completed</p>
              <p className="text-xl font-bold text-gray-900">{data.interviewAnalytics.mockInterviewsCompleted}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-600">Average Rubric Score</p>
              <p className="text-xl font-bold text-purple-600">{data.interviewAnalytics.averageFeedbackScore}%</p>
            </div>
          </div>

          <div className="mt-3">
            <p className="text-[11px] font-semibold text-gray-600">Areas Recommended for Practice:</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {data.interviewAnalytics.areasToPractice.map((area) => (
                <span
                  key={area}
                  className="inline-block rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Report Generator Modal */}
      <ReportGeneratorModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        scopeType="STUDENT"
        scopeId={data.studentId}
        defaultTitle={`Career Analytics - ${data.studentName}`}
        token={token}
      />

      {/* Scheduled Reports Modal */}
      <ScheduledReportsModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        scopeType="STUDENT"
        scopeId={data.studentId}
        token={token}
      />
    </div>
  );
};
