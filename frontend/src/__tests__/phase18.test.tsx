import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MetricCard } from '../components/analytics/MetricCard';
import { DateRangeFilter } from '../components/analytics/DateRangeFilter';
import { AnalyticsFunnel } from '../components/analytics/AnalyticsFunnel';
import { SkillGapChart } from '../components/analytics/SkillGapChart';
import { ExportButton } from '../components/analytics/ExportButton';
import { ReportGeneratorModal } from '../components/analytics/ReportGeneratorModal';
import { ScheduledReportsModal } from '../components/analytics/ScheduledReportsModal';
import { StudentAnalyticsDashboard } from '../components/analytics/StudentAnalyticsDashboard';
import { CollegeAnalyticsDashboard } from '../components/analytics/CollegeAnalyticsDashboard';
import { EmployerAnalyticsDashboard } from '../components/analytics/EmployerAnalyticsDashboard';
import { AdminPlatformAnalyticsDashboard } from '../components/analytics/AdminPlatformAnalyticsDashboard';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    getStudentAnalyticsApi: vi.fn(),
    getCollegeAnalyticsApi: vi.fn(),
    getEmployerAnalyticsApi: vi.fn(),
    getAdminAnalyticsApi: vi.fn(),
    generateReportApi: vi.fn(),
    downloadReportApi: vi.fn(),
    listSchedulesApi: vi.fn(),
    createScheduleApi: vi.fn(),
    updateScheduleApi: vi.fn(),
    deleteScheduleApi: vi.fn(),
  };
});

describe('Phase 18 — Advanced Analytics & Reporting Frontend Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Reusable MetricCard Component', () => {
    it('renders label, formatted value, subtitle, trend, and badge', () => {
      render(
        <MetricCard
          label="Verified Job Offers"
          value={38}
          subtitle="Confirmed offers recorded"
          badge="Verified"
          trend={{ value: '+14% vs prev', isPositive: true }}
          variant="success"
        />
      );

      expect(screen.getByText('Verified Job Offers')).toBeInTheDocument();
      expect(screen.getByText('38')).toBeInTheDocument();
      expect(screen.getByText('Confirmed offers recorded')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('+14% vs prev')).toBeInTheDocument();
    });
  });

  describe('2. Global DateRangeFilter Component', () => {
    it('renders preset options and responds to selection changes', () => {
      const handleChange = vi.fn();
      render(<DateRangeFilter value={{ preset: '30D' }} onChange={handleChange} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('30D');

      fireEvent.change(select, { target: { value: '7D' } });
      expect(handleChange).toHaveBeenCalledWith({ preset: '7D' });
    });

    it('shows date pickers when CUSTOM preset is selected', () => {
      const handleChange = vi.fn();
      render(<DateRangeFilter value={{ preset: 'CUSTOM', from: '2026-09-01', to: '2026-09-30' }} onChange={handleChange} />);

      expect(screen.getByText('Apply')).toBeInTheDocument();
      const inputs = screen.getAllByDisplayValue(/2026-09/);
      expect(inputs.length).toBe(2);
    });
  });

  describe('3. AnalyticsFunnel Component', () => {
    it('renders unique student conversion funnel stages and ethical notice', () => {
      const mockStages = [
        { stage: 'Registered Students', count: 184, conversionPercentage: 100 },
        { stage: 'Eligible Students', count: 142, conversionPercentage: 77 },
        { stage: 'Applied Students', count: 118, conversionPercentage: 83 },
        { stage: 'Selected Students', count: 38, conversionPercentage: 32 },
      ];

      render(
        <AnalyticsFunnel
          title="Campus Conversion Funnel"
          subtitle="Milestones"
          stages={mockStages}
          countingUnit="UNIQUE_STUDENTS"
        />
      );

      expect(screen.getByText('Campus Conversion Funnel')).toBeInTheDocument();
      expect(screen.getByText('👤 Unique Students')).toBeInTheDocument();
      expect(screen.getByText('Registered Students')).toBeInTheDocument();
      expect(screen.getByText('Selected Students')).toBeInTheDocument();
      expect(screen.getByText(/Methodology Guarantee:/i)).toBeInTheDocument();
    });
  });

  describe('4. SkillGapChart Component', () => {
    it('renders top missing skills and triggers learning path navigation callback', () => {
      const onNavigate = vi.fn();
      const mockSkills = [
        {
          skill: 'Docker',
          studentCount: 78,
          percentageOfCohort: 42,
          recommendedLearningPathId: 'devops-cloud-essentials',
          recommendedLearningPathTitle: 'Cloud & DevOps Essentials',
        },
      ];

      render(
        <SkillGapChart
          missingSkills={mockSkills}
          onNavigateToLearning={onNavigate}
        />
      );

      expect(screen.getByText('Docker')).toBeInTheDocument();
      expect(screen.getByText(/Missing in/i)).toBeInTheDocument();
      expect(screen.getByText(/78 students/i)).toBeInTheDocument();

      const btn = screen.getByText(/Cloud & DevOps Essentials/i);
      fireEvent.click(btn);
      expect(onNavigate).toHaveBeenCalledWith('devops-cloud-essentials');
    });
  });

  describe('5. ExportButton Component', () => {
    it('opens format dropdown on click and triggers CSV export', () => {
      const handleExport = vi.fn();
      render(<ExportButton onExport={handleExport} label="Export" />);

      const btn = screen.getByText(/Export/i);
      fireEvent.click(btn);

      const csvOption = screen.getByText(/Export as CSV/i);
      expect(csvOption).toBeInTheDocument();

      fireEvent.click(csvOption);
      expect(handleExport).toHaveBeenCalledWith('CSV');
    });
  });

  describe('6. ReportGeneratorModal Component', () => {
    it('handles report generation and initiates download', async () => {
      (api.generateReportApi as any).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'rep_123',
          fileName: 'report.csv',
        },
      });

      (api.downloadReportApi as any).mockResolvedValueOnce({
        success: true,
        content: 'Category,Metric,Value\nTest,Score,100',
        filename: 'report.csv',
      });

      render(
        <ReportGeneratorModal
          isOpen={true}
          onClose={vi.fn()}
          scopeType="STUDENT"
          scopeId="stud-1"
        />
      );

      expect(screen.getByText('Generate & Export Report')).toBeInTheDocument();
      const submitBtn = screen.getByRole('button', { name: /Generate & Download/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.generateReportApi).toHaveBeenCalled();
      });
    });
  });

  describe('7. ScheduledReportsModal Component', () => {
    it('renders active schedules and allows creating a new schedule', async () => {
      (api.listSchedulesApi as any).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'sched-1',
            title: 'Weekly Digest',
            frequency: 'WEEKLY',
            format: 'CSV',
            enabled: true,
          },
        ],
      });

      render(
        <ScheduledReportsModal
          isOpen={true}
          onClose={vi.fn()}
          scopeType="COLLEGE"
          scopeId="col-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Weekly Digest')).toBeInTheDocument();
      });

      const newSchedBtn = screen.getByText('+ New Schedule');
      fireEvent.click(newSchedBtn);
      expect(screen.getByPlaceholderText(/Weekly Placement Digest/i)).toBeInTheDocument();
    });
  });

  describe('8. StudentAnalyticsDashboard', () => {
    it('renders student career overview, status distribution, ATS score, and learning progress', async () => {
      (api.getStudentAnalyticsApi as any).mockResolvedValueOnce({
        success: true,
        data: {
          studentId: 'stud-1',
          studentName: 'Rahul Verma',
          overview: {
            totalApplications: 6,
            activeApplications: 3,
            shortlistedCount: 2,
            selectedOffersCount: 1,
            rejectedCount: 1,
            statusBreakdown: [{ status: 'APPLIED', count: 3, percentage: 50 }],
          },
          skillAssessmentAnalytics: {
            totalAttemptsCount: 4,
            averageScore: 82,
            roleGaps: [{ skill: 'Docker', status: 'PRACTICE_NEEDED' }],
          },
          learningAnalytics: {
            enrolledPathsCount: 2,
            completedModulesCount: 8,
            averageQuizScore: 85,
            streakDays: 5,
          },
          resumeAnalytics: {
            latestScore: 78,
            topMissingKeywords: ['Microservices', 'Kubernetes'],
            versionCount: 2,
          },
          interviewAnalytics: {
            mockInterviewsCompleted: 3,
            averageFeedbackScore: 80,
            areasToPractice: ['System Design'],
          },
          readinessIndicators: {
            profileCompletenessScore: 88,
            verifiedSkillsScore: 80,
            projectPortfolioScore: 85,
            resumeScore: 78,
            interviewScore: 80,
            dataCoverageNotes: [],
          },
        },
      });

      render(<StudentAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Career Progress & Readiness Analytics')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Applications')).toBeInTheDocument();
      expect(screen.getByText('Verified Offers')).toBeInTheDocument();
      expect(screen.getByText('ATS Resume Score')).toBeInTheDocument();
      expect(screen.getByText('Learning Hub Progress')).toBeInTheDocument();
    });
  });

  describe('9. CollegeAnalyticsDashboard', () => {
    it('renders institutional placement intelligence, conversion funnel, and department breakdown', async () => {
      (api.getCollegeAnalyticsApi as any).mockResolvedValueOnce({
        success: true,
        data: {
          collegeId: 'col-1',
          collegeName: 'Government Engineering College',
          institutionOverview: {
            totalRegisteredStudents: 184,
            activeStudents: 136,
            totalApplications: 286,
            activeOpportunitiesCount: 24,
          },
          placementMetrics: {
            totalEligibleStudents: 142,
            totalAppliedStudents: 118,
            totalShortlistedStudents: 64,
            totalInterviewedStudents: 46,
            totalSelectedStudents: 38,
          },
          placementFunnel: {
            type: 'UNIQUE_STUDENTS',
            stages: [
              { stage: 'Registered Students', count: 184, conversionPercentage: 100 },
              { stage: 'Selected Students', count: 38, conversionPercentage: 32 },
            ],
            overallPlacementRate: 32,
          },
          skillGapAnalytics: {
            topMissingSkills: [
              { skill: 'Docker', studentCount: 78, percentageOfCohort: 42, recommendedLearningPathTitle: 'Cloud Essentials' },
            ],
          },
          departmentBreakdown: [
            { department: 'Computer Science', registeredCount: 82, appliedCount: 64, selectedCount: 24, averageProfileScore: 78 },
          ],
          placementDriveReports: [],
          dataQualityAudit: {
            missingInstitutionCount: 0,
            incompleteProfilesCount: 42,
            unassessedStudentsCount: 28,
            notes: ['Isolated to verified institutional enrollment.'],
          },
        },
      });

      render(<CollegeAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Government Engineering College')).toBeInTheDocument();
      });

      expect(screen.getByText('Registered Students')).toBeInTheDocument();
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
    });
  });

  describe('10. EmployerAnalyticsDashboard', () => {
    it('renders recruitment pipeline, active jobs breakdown, and status distribution', async () => {
      (api.getEmployerAnalyticsApi as any).mockResolvedValueOnce({
        success: true,
        data: {
          employerId: 'emp-1',
          companyName: 'BharatTech Labs',
          overview: {
            totalJobsPosted: 6,
            activeJobsCount: 4,
            totalApplicationsReceived: 148,
            underReviewCount: 28,
            shortlistedCount: 42,
            interviewCount: 26,
            finalSelectionsCount: 14,
          },
          jobPerformance: [
            {
              driveId: 'job-1',
              title: 'Associate Software Engineer',
              status: 'ACTIVE',
              applicationsCount: 58,
              eligibleCount: 48,
              shortlistedCount: 18,
              interviewCount: 12,
              selectedCount: 6,
            },
          ],
          recruitmentFunnel: [
            { stage: 'Applications Received', count: 148, conversionPercentage: 100 },
            { stage: 'Final Offers Extended', count: 14, conversionPercentage: 54 },
          ],
          statusDistribution: [
            { status: 'APPLIED', count: 46, percentage: 31 },
          ],
        },
      });

      render(<EmployerAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('BharatTech Labs')).toBeInTheDocument();
      });

      expect(screen.getByText('Associate Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Total Jobs Posted')).toBeInTheDocument();
    });
  });

  describe('11. AdminPlatformAnalyticsDashboard', () => {
    it('renders cross-tenant ecosystem metrics, feature engagement, and system health telemetry', async () => {
      (api.getAdminAnalyticsApi as any).mockResolvedValueOnce({
        success: true,
        data: {
          platformOverview: {
            totalStudents: 1240,
            totalColleges: 38,
            totalEmployers: 84,
            totalPlacementDrives: 142,
            totalApplications: 3420,
          },
          platformEngagement: {
            dailyActiveUsers: 412,
            weeklyActiveUsers: 845,
            monthlyActiveUsers: 1092,
            featureEngagement: {
              learningHub: 2150,
              assessments: 1430,
              resumeAnalyzer: 890,
              mockInterviews: 620,
              mentorship: 320,
            },
          },
          recruitmentOverview: {
            totalVerifiedSelections: 480,
            topHiringEmployers: [
              { companyName: 'BharatTech Labs', drivesCount: 8, applicationsReceived: 620, selectionsCount: 74 },
            ],
            topParticipatingColleges: [
              { collegeName: 'Government Engineering College, Bilaspur', studentsCount: 184, applicationsCount: 490, selectionsCount: 68 },
            ],
          },
          systemHealthTelemetry: {
            status: 'OPERATIONAL',
            databaseStatus: 'connected',
            averageLatencyMs: 38,
            errorRatePercentage: 0.02,
          },
          dataQualityOverview: {
            healthyRecordsPercentage: 99.9,
          },
        },
      });

      render(<AdminPlatformAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText('CareerBridge Platform Intelligence & Telemetry')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Students')).toBeInTheDocument();
      expect(screen.getByText('Partner Colleges')).toBeInTheDocument();
      expect(screen.getByText('System Telemetry & Health')).toBeInTheDocument();
    });
  });
});
