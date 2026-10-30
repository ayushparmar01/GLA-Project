import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { MetricsDefinitionService } from '../services/metricsDefinition.service.js';
import { AnalyticsDateService } from '../services/analyticsDate.service.js';
import { StudentAnalyticsService } from '../services/studentAnalytics.service.js';
import { CollegeAnalyticsService } from '../services/collegeAnalytics.service.js';
import { EmployerAnalyticsService } from '../services/employerAnalytics.service.js';
import { AdminAnalyticsService } from '../services/adminAnalytics.service.js';
import { ReportExportService } from '../services/reportExport.service.js';

describe('Phase 18 — Advanced Analytics & Reporting Platform Tests', () => {
  const app = createApp();

  describe('1. Centralized Metric Definition & Transparency Layer', () => {
    it('should expose complete dictionary of defined metrics with formulas and limitations', () => {
      const definitions = MetricsDefinitionService.getAllDefinitions();
      expect(definitions).toBeDefined();

      const keys = Object.keys(definitions);
      expect(keys.length).toBeGreaterThanOrEqual(10);
      expect(keys).toContain('TOTAL_APPLICATIONS');
      expect(keys).toContain('UNIQUE_APPLICANTS');
      expect(keys).toContain('SHORTLISTED_APPLICATIONS');
      expect(keys).toContain('VERIFIED_SELECTIONS');
      expect(keys).toContain('PLACEMENT_CONVERSION_RATE');

      // Verify each definition contains formula, counting unit, and limitations
      const verifiedSel = definitions['VERIFIED_SELECTIONS'];
      expect(verifiedSel.name).toBe('Verified Final Selections');
      expect(verifiedSel.formula).toContain("status === 'SELECTED'");
      expect(verifiedSel.countingUnit).toBe('Verified Selections (Offers)');
      expect(verifiedSel.limitations).toContain('Strictly excludes shortlisted candidates');

      const conversion = definitions['PLACEMENT_CONVERSION_RATE'];
      expect(conversion.formula).toContain('(Unique Selected Students / Unique Applied Students) * 100');
    });

    it('should retrieve single metric definition by key', () => {
      const metric = MetricsDefinitionService.getDefinition('UNIQUE_APPLICANTS');
      expect(metric).toBeDefined();
      expect(metric?.key).toBe('UNIQUE_APPLICANTS');
      expect(metric?.countingUnit).toBe('Unique Students');
    });
  });

  describe('2. Global Date Filter & Timeseries Service', () => {
    it('should resolve standard presets correctly into start and end dates', () => {
      const preset30d = AnalyticsDateService.resolveDateRange({ preset: '30D' });
      expect(preset30d.start).toBeInstanceOf(Date);
      expect(preset30d.end).toBeInstanceOf(Date);
      expect(preset30d.end.getTime()).toBeGreaterThan(preset30d.start.getTime());

      const diffDays = Math.round((preset30d.end.getTime() - preset30d.start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBeGreaterThanOrEqual(29);
      expect(diffDays).toBeLessThanOrEqual(31);

      const preset7d = AnalyticsDateService.resolveDateRange({ preset: '7D' });
      const diff7 = Math.round((preset7d.end.getTime() - preset7d.start.getTime()) / (1000 * 60 * 60 * 24));
      expect(diff7).toBeGreaterThanOrEqual(6);
      expect(diff7).toBeLessThanOrEqual(8);
    });

    it('should resolve custom from and to dates', () => {
      const customRange = AnalyticsDateService.resolveDateRange({
        preset: 'CUSTOM',
        from: '2026-09-01T00:00:00.000Z',
        to: '2026-09-30T23:59:59.999Z',
      });

      expect(customRange.start.toISOString()).toContain('2026-09-01');
      expect(customRange.end.toISOString()).toContain('2026-09-30');
    });

    it('should generate timeseries buckets for trend plotting', () => {
      const { start, end } = AnalyticsDateService.resolveDateRange({ preset: '30D' });
      const buckets = AnalyticsDateService.generateTimeseriesBuckets('30D', start, end);

      expect(buckets.length).toBeGreaterThan(0);
      expect(buckets[0]).toHaveProperty('date');
      expect(buckets[0]).toHaveProperty('count');
    });
  });

  describe('3. Student Career Analytics & Privacy Isolation', () => {
    const studentId = 'student-analytics-test-1';

    it('should compute complete student career progress and readiness indicators', async () => {
      const analytics = await StudentAnalyticsService.getInstance().getStudentAnalytics(studentId, {
        preset: '30D',
      });

      expect(analytics).toBeDefined();
      expect(analytics.studentId).toBe(studentId);
      expect(analytics.overview).toHaveProperty('totalApplications');
      expect(analytics.overview).toHaveProperty('activeApplications');
      expect(analytics.overview).toHaveProperty('shortlistedCount');
      expect(analytics.overview).toHaveProperty('selectedOffersCount');
      expect(Array.isArray(analytics.overview.statusBreakdown)).toBe(true);

      // Verify skill assessment metrics
      expect(analytics.skillAssessmentAnalytics).toHaveProperty('totalAttemptsCount');
      expect(analytics.skillAssessmentAnalytics).toHaveProperty('averageScore');

      // Verify learning hub progress
      expect(analytics.learningAnalytics).toHaveProperty('enrolledPathsCount');
      expect(analytics.learningAnalytics).toHaveProperty('completedModulesCount');

      // Verify ATS resume metrics
      expect(analytics.resumeAnalytics).toHaveProperty('latestScore');
      expect(Array.isArray(analytics.resumeAnalytics.topMissingKeywords)).toBe(true);

      // Verify Mock interview analytics
      expect(analytics.interviewAnalytics).toHaveProperty('mockInterviewsCompleted');
      expect(analytics.interviewAnalytics).toHaveProperty('averageFeedbackScore');

      // Verify transparent readiness indicators
      expect(analytics.readinessIndicators.profileCompletenessScore).toBeGreaterThanOrEqual(0);
      expect(analytics.readinessIndicators.verifiedSkillsScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('4. College Institutional Placement Analytics & Conversion Funnel', () => {
    const collegeId = 'college-analytics-test-1';

    it('should compute institutional placement metrics scoped to college', async () => {
      const analytics = await CollegeAnalyticsService.getInstance().getCollegeAnalytics(collegeId, {
        preset: '30D',
      });

      expect(analytics).toBeDefined();
      expect(analytics.collegeId).toBe(collegeId);
      expect(analytics.institutionOverview.totalRegisteredStudents).toBeGreaterThan(0);
      expect(analytics.placementMetrics.totalAppliedStudents).toBeGreaterThan(0);
      expect(analytics.placementMetrics.totalSelectedStudents).toBeGreaterThanOrEqual(0);
    });

    it('should calculate unique-student placement conversion funnel and never count shortlisted as selected', async () => {
      const analytics = await CollegeAnalyticsService.getInstance().getCollegeAnalytics(collegeId);

      expect(analytics.placementFunnel.type).toBe('UNIQUE_STUDENTS');
      const stages = analytics.placementFunnel.stages;
      expect(stages.length).toBe(6);

      const stageNames = stages.map((s) => s.stage);
      expect(stageNames).toEqual([
        'Registered Students',
        'Eligible Students',
        'Applied Students',
        'Shortlisted Students',
        'Interviewed Students',
        'Selected Students',
      ]);

      // Unique student count must not artificially exceed registered students
      const registeredCount = stages[0].count;
      const appliedCount = stages[2].count;
      const shortlistedCount = stages[3].count;
      const selectedCount = stages[5].count;

      expect(appliedCount).toBeLessThanOrEqual(registeredCount);
      expect(shortlistedCount).toBeLessThanOrEqual(appliedCount);
      expect(selectedCount).toBeLessThanOrEqual(shortlistedCount);

      // Verify overall placement rate formula: selected / applied * 100
      const expectedRate = Math.round((selectedCount / appliedCount) * 100);
      expect(analytics.placementFunnel.overallPlacementRate).toBe(expectedRate);
    });

    it('should aggregate top missing skills and link to Phase 17 Learning Paths', async () => {
      const analytics = await CollegeAnalyticsService.getInstance().getCollegeAnalytics(collegeId);

      expect(analytics.skillGapAnalytics.topMissingSkills.length).toBeGreaterThan(0);
      const firstSkill = analytics.skillGapAnalytics.topMissingSkills[0];
      expect(firstSkill).toHaveProperty('skill');
      expect(firstSkill).toHaveProperty('studentCount');
      expect(firstSkill).toHaveProperty('percentageOfCohort');
      expect(firstSkill).toHaveProperty('recommendedLearningPathTitle');
    });

    it('should provide department breakdowns and data quality audits', async () => {
      const analytics = await CollegeAnalyticsService.getInstance().getCollegeAnalytics(collegeId);

      expect(analytics.departmentBreakdown.length).toBeGreaterThan(0);
      const firstDept = analytics.departmentBreakdown[0];
      expect(firstDept).toHaveProperty('department');
      expect(firstDept).toHaveProperty('registeredCount');
      expect(firstDept).toHaveProperty('appliedCount');
      expect(firstDept).toHaveProperty('selectedCount');

      expect(analytics.dataQualityAudit).toHaveProperty('incompleteProfilesCount');
      expect(analytics.dataQualityAudit.notes.length).toBeGreaterThan(0);
    });
  });

  describe('5. Employer Recruitment Analytics', () => {
    const employerId = 'employer-analytics-test-1';

    it('should compute recruitment overview, per-job performance, and pipeline funnel', async () => {
      const analytics = await EmployerAnalyticsService.getInstance().getEmployerAnalytics(employerId);

      expect(analytics).toBeDefined();
      expect(analytics.employerId).toBe(employerId);
      expect(analytics.overview.totalJobsPosted).toBeGreaterThan(0);
      expect(analytics.overview.totalApplicationsReceived).toBeGreaterThan(0);
      expect(analytics.overview.shortlistedCount).toBeGreaterThan(0);
      expect(analytics.overview.finalSelectionsCount).toBeGreaterThan(0);

      // Verify job performance table
      expect(analytics.jobPerformance.length).toBeGreaterThan(0);
      const firstJob = analytics.jobPerformance[0];
      expect(firstJob).toHaveProperty('title');
      expect(firstJob).toHaveProperty('applicationsCount');
      expect(firstJob).toHaveProperty('selectedCount');

      // Verify recruitment funnel
      expect(analytics.recruitmentFunnel.length).toBeGreaterThan(0);
      expect(analytics.statusDistribution.length).toBeGreaterThan(0);
    });
  });

  describe('6. Admin Platform Analytics & Telemetry', () => {
    it('should aggregate platform-wide telemetry and feature engagement', async () => {
      const analytics = await AdminAnalyticsService.getInstance().getAdminAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.platformOverview.totalStudents).toBeGreaterThan(0);
      expect(analytics.platformOverview.totalColleges).toBeGreaterThan(0);
      expect(analytics.platformOverview.totalEmployers).toBeGreaterThan(0);
      expect(analytics.platformOverview.totalApplications).toBeGreaterThan(0);

      // Feature engagement
      expect(analytics.platformEngagement.featureEngagement.learningHub).toBeGreaterThan(0);
      expect(analytics.platformEngagement.featureEngagement.assessments).toBeGreaterThan(0);
      expect(analytics.platformEngagement.featureEngagement.resumeAnalyzer).toBeGreaterThan(0);
      expect(analytics.platformEngagement.featureEngagement.mockInterviews).toBeGreaterThan(0);

      // Telemetry
      expect(analytics.systemHealthTelemetry.status).toBe('OPERATIONAL');
      expect(analytics.systemHealthTelemetry.averageLatencyMs).toBeGreaterThan(0);
    });

    it('should preserve Phase 9 backward-compatible static methods on AdminAnalyticsService', async () => {
      const dashboardMetrics = await AdminAnalyticsService.getDashboardMetrics();
      expect(dashboardMetrics).toBeDefined();
      expect(dashboardMetrics.totalUsers).toBeGreaterThan(0);

      const platformReport = await AdminAnalyticsService.getPlatformAnalytics();
      expect(platformReport).toBeDefined();
      expect(platformReport.applicationFunnel).toBeDefined();
      expect(platformReport.transparentPlacementOutcomes).toBeDefined();

      const health = AdminAnalyticsService.getSystemHealthDiagnostics();
      expect(health.server.status).toBe('healthy');
      expect(health.database).toBeDefined();
    });
  });

  describe('7. Report Generation, RFC 4180 CSV & Formatted Document Export Engine', () => {
    it('should escape CSV cells according to RFC 4180 standard', () => {
      const service = ReportExportService.getInstance();
      expect(service.escapeCsvCell('SimpleText')).toBe('SimpleText');
      expect(service.escapeCsvCell('Text, with comma')).toBe('"Text, with comma"');
      expect(service.escapeCsvCell('Text with "quotes"')).toBe('"Text with ""quotes"""');
      expect(service.escapeCsvCell('Line1\nLine2')).toBe('"Line1\nLine2"');
    });

    it('should generate valid RFC 4180 CSV export report for College scope', async () => {
      const report = await ReportExportService.getInstance().generateReport({
        title: 'Institutional Placement Report',
        reportType: 'COLLEGE_PLACEMENT_CSV',
        format: 'CSV',
        scopeType: 'COLLEGE',
        scopeId: 'college-test-rep',
        generatedBy: 'admin-1',
      });

      expect(report.id).toBeDefined();
      expect(report.format).toBe('CSV');
      expect(report.fileName).toContain('.csv');
      expect(report.fileSizeBytes).toBeGreaterThan(50);
      expect(report.fileContent).toContain('Funnel Stage,Unique Students Count,Conversion Rate %,Stage Description');
      expect(report.fileContent).toContain('Registered Students');
      expect(report.fileContent).toContain('Selected Students');
    });

    it('should generate formatted document report with methodology notice', async () => {
      const report = await ReportExportService.getInstance().generateReport({
        title: 'Recruitment Performance Digest',
        reportType: 'EMPLOYER_DIGEST',
        format: 'PDF',
        scopeType: 'EMPLOYER',
        scopeId: 'employer-test-rep',
        generatedBy: 'employer-1',
      });

      expect(report.format).toBe('PDF');
      expect(report.fileContent).toContain('CAREERBRIDGE ANALYTICS & REPORTING SYSTEM');
      expect(report.fileContent).toContain('DATA INTEGRITY & METHODOLOGY NOTICE:');
      expect(report.fileContent).toContain('All placement statistics strictly reflect verified database offer records.');
    });

    it('should support scheduled reports creation, listing, updating, and deletion', async () => {
      const service = ReportExportService.getInstance();
      const schedule = await service.createScheduledReport({
        title: 'Weekly Placement Digest',
        reportType: 'COLLEGE_WEEKLY',
        scopeType: 'COLLEGE',
        scopeId: 'college-sched-1',
        frequency: 'WEEKLY',
        format: 'CSV',
        recipients: ['tpo@college.edu'],
        createdBy: 'college-user-1',
      });

      expect(schedule.id).toBeDefined();
      expect(schedule.frequency).toBe('WEEKLY');
      expect(schedule.enabled).toBe(true);

      const list = await service.listScheduledReports('COLLEGE', 'college-sched-1');
      expect(list.some((s) => s.id === schedule.id)).toBe(true);

      const updated = await service.updateScheduledReport(schedule.id, { enabled: false });
      expect(updated?.enabled).toBe(false);

      await service.deleteScheduledReport(schedule.id);
      const postDelete = await service.listScheduledReports('COLLEGE', 'college-sched-1');
      expect(postDelete.some((s) => s.id === schedule.id)).toBe(false);
    });
  });

  describe('8. API Endpoint RBAC & Security Guard Verification', () => {
    it('GET /api/analytics/metrics-definitions should be publicly accessible', async () => {
      const res = await request(app).get('/api/analytics/metrics-definitions');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.TOTAL_APPLICATIONS).toBeDefined();
    });

    it('GET /api/analytics/student should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/analytics/student');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/analytics/college should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/analytics/college');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/analytics/employer should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/analytics/employer');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/analytics/admin should reject unauthenticated requests (401)', async () => {
      const res = await request(app).get('/api/analytics/admin');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/analytics/reports/generate should require authentication (401)', async () => {
      const res = await request(app).post('/api/analytics/reports/generate').send({
        format: 'CSV',
        scopeType: 'STUDENT',
      });
      expect(res.status).toBe(401);
    });

    it('GET /api/analytics/schedules should require authentication (401)', async () => {
      const res = await request(app).get('/api/analytics/schedules');
      expect(res.status).toBe(401);
    });
  });
});
