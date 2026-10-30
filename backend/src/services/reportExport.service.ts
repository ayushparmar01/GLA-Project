import { randomUUID } from 'crypto';
import { ReportHistory } from '../models/reportHistory.model.js';
import { ScheduledReport } from '../models/scheduledReport.model.js';
import { getDbStatus } from '../config/db.js';
import {
  ReportFormat,
  ReportScopeType,
  ReportHistoryData,
  ScheduledReportData,
  AnalyticsDateFilter,
} from '../types/index.js';
import { StudentAnalyticsService } from './studentAnalytics.service.js';
import { CollegeAnalyticsService } from './collegeAnalytics.service.js';
import { EmployerAnalyticsService } from './employerAnalytics.service.js';
import { AdminAnalyticsService } from './adminAnalytics.service.js';

export class ReportExportService {
  private static instance: ReportExportService;
  private inMemoryReports: Map<string, ReportHistoryData> = new Map();
  private inMemorySchedules: Map<string, ScheduledReportData> = new Map();

  public static getInstance(): ReportExportService {
    if (!ReportExportService.instance) {
      ReportExportService.instance = new ReportExportService();
    }
    return ReportExportService.instance;
  }

  public escapeCsvCell(val: any): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  public toCsvString(headers: string[], rows: any[][]): string {
    const headerRow = headers.map((h) => this.escapeCsvCell(h)).join(',');
    const dataRows = rows.map((row) => row.map((cell) => this.escapeCsvCell(cell)).join(','));
    return [headerRow, ...dataRows].join('\r\n');
  }

  public async generateReport(params: {
    title?: string;
    reportType: string;
    format: ReportFormat;
    scopeType: ReportScopeType;
    scopeId: string;
    generatedBy: string;
    filter?: AnalyticsDateFilter;
  }): Promise<ReportHistoryData> {
    const reportId = `rep_${randomUUID().substring(0, 12)}`;
    const format = params.format || 'CSV';
    const period = params.filter?.preset || '30D';
    const timestamp = new Date().toISOString();

    let title = params.title;
    let fileContent = '';
    let summary: Record<string, any> = {};

    if (params.scopeType === 'STUDENT') {
      const data = await StudentAnalyticsService.getInstance().getStudentAnalytics(params.scopeId, params.filter);
      title = title || `Career Analytics Report - ${data.studentName}`;
      summary = {
        totalApplications: data.overview.totalApplications,
        activeApplications: data.overview.activeApplications,
        shortlisted: data.overview.shortlistedCount,
        verifiedSelections: data.overview.selectedOffersCount,
        readinessScore: data.readinessIndicators.profileCompletenessScore,
      };

      if (format === 'CSV') {
        const headers = ['Category', 'Metric', 'Value', 'Details'];
        const rows = [
          ['Overview', 'Total Applications', data.overview.totalApplications, 'Count within period'],
          ['Overview', 'Active Applications', data.overview.activeApplications, 'Pending / Under Review / Shortlisted'],
          ['Overview', 'Shortlisted Count', data.overview.shortlistedCount, 'Interviews scheduled or qualified'],
          ['Overview', 'Verified Job Selections', data.overview.selectedOffersCount, 'Verified final selections'],
          ['Learning', 'Enrolled Paths', data.learningAnalytics.enrolledPathsCount, 'Learning Hub enrollments'],
          ['Learning', 'Completed Modules', data.learningAnalytics.completedModulesCount, 'Modules completed'],
          ['Assessments', 'Attempts Count', data.skillAssessmentAnalytics.totalAttemptsCount, 'Skill assessments taken'],
          ['Assessments', 'Average Score', `${data.skillAssessmentAnalytics.averageScore}%`, 'Average across attempts'],
          ['Resume', 'ATS Latest Score', data.resumeAnalytics.latestScore || 'N/A', 'ATS optimization score'],
          ['Interview', 'Mock Interviews Completed', data.interviewAnalytics.mockInterviewsCompleted, 'AI practice sessions'],
        ];
        fileContent = this.toCsvString(headers, rows);
      } else {
        fileContent = this.generatePdfTextDocument({
          title,
          reportId,
          scopeType: params.scopeType,
          scopeId: params.scopeId,
          period,
          generatedAt: timestamp,
          summary,
          sections: [
            {
              heading: 'Placement & Applications Summary',
              items: [
                `Total Applications: ${data.overview.totalApplications}`,
                `Active Applications: ${data.overview.activeApplications}`,
                `Shortlisted Applications: ${data.overview.shortlistedCount}`,
                `Verified Offers: ${data.overview.selectedOffersCount}`,
              ],
            },
            {
              heading: 'Learning & Skill Readiness',
              items: [
                `Enrolled Learning Paths: ${data.learningAnalytics.enrolledPathsCount}`,
                `Completed Modules: ${data.learningAnalytics.completedModulesCount}`,
                `Assessment Attempts: ${data.skillAssessmentAnalytics.totalAttemptsCount}`,
                `ATS Resume Score: ${data.resumeAnalytics.latestScore || 'Pending'}`,
              ],
            },
          ],
        });
      }
    } else if (params.scopeType === 'COLLEGE') {
      const data = await CollegeAnalyticsService.getInstance().getCollegeAnalytics(params.scopeId, params.filter);
      title = title || `Institutional Placement Report - ${data.collegeName}`;
      summary = {
        totalRegistered: data.institutionOverview.totalRegisteredStudents,
        eligible: data.placementMetrics.totalEligibleStudents,
        applied: data.placementMetrics.totalAppliedStudents,
        shortlisted: data.placementMetrics.totalShortlistedStudents,
        selected: data.placementMetrics.totalSelectedStudents,
        placementRate: `${data.placementFunnel.overallPlacementRate}%`,
      };

      if (format === 'CSV') {
        const headers = ['Funnel Stage', 'Unique Students Count', 'Conversion Rate %', 'Stage Description'];
        const rows = data.placementFunnel.stages.map((st) => [
          st.stage,
          st.count,
          `${st.conversionPercentage}%`,
          st.description,
        ]);
        rows.push(['Overall Placement Conversion', data.placementMetrics.totalSelectedStudents, `${data.placementFunnel.overallPlacementRate}%`, 'Selected / Applied unique students']);
        fileContent = this.toCsvString(headers, rows);
      } else {
        fileContent = this.generatePdfTextDocument({
          title,
          reportId,
          scopeType: params.scopeType,
          scopeId: params.scopeId,
          period,
          generatedAt: timestamp,
          summary,
          sections: [
            {
              heading: 'Placement Conversion Funnel (Unique Students)',
              items: data.placementFunnel.stages.map(
                (st) => `${st.stage}: ${st.count} students (${st.conversionPercentage}% conversion)`
              ),
            },
            {
              heading: 'Top Missing Skills & Learning Interventions',
              items: data.skillGapAnalytics.topMissingSkills.map(
                (sk) => `${sk.skill}: ${sk.studentCount} students (${sk.percentageOfCohort}%). Recommended: ${sk.recommendedLearningPathTitle || 'Self-paced track'}`
              ),
            },
          ],
        });
      }
    } else if (params.scopeType === 'EMPLOYER') {
      const data = await EmployerAnalyticsService.getInstance().getEmployerAnalytics(params.scopeId, params.filter);
      title = title || `Recruitment Analytics Report - ${data.companyName}`;
      summary = {
        totalJobs: data.overview.totalJobsPosted,
        activeJobs: data.overview.activeJobsCount,
        applications: data.overview.totalApplicationsReceived,
        shortlisted: data.overview.shortlistedCount,
        interviews: data.overview.interviewCount,
        finalOffers: data.overview.finalSelectionsCount,
      };

      if (format === 'CSV') {
        const headers = ['Job Title', 'Status', 'Applications', 'Eligible', 'Shortlisted', 'Interviewed', 'Selected'];
        const rows = data.jobPerformance.map((j) => [
          j.title,
          j.status,
          j.applicationsCount,
          j.eligibleCount,
          j.shortlistedCount,
          j.interviewCount,
          j.selectedCount,
        ]);
        fileContent = this.toCsvString(headers, rows);
      } else {
        fileContent = this.generatePdfTextDocument({
          title,
          reportId,
          scopeType: params.scopeType,
          scopeId: params.scopeId,
          period,
          generatedAt: timestamp,
          summary,
          sections: [
            {
              heading: 'Recruitment Pipeline Performance',
              items: [
                `Total Openings Posted: ${data.overview.totalJobsPosted}`,
                `Applications Received: ${data.overview.totalApplicationsReceived}`,
                `Shortlisted Candidates: ${data.overview.shortlistedCount}`,
                `Interviews Conducted: ${data.overview.interviewCount}`,
                `Final Offers Made: ${data.overview.finalSelectionsCount}`,
              ],
            },
          ],
        });
      }
    } else {
      // ADMIN
      const data = await AdminAnalyticsService.getInstance().getAdminAnalytics(params.filter);
      title = title || 'Platform-Wide Governance & Analytics Report';
      summary = {
        totalStudents: data.platformOverview.totalStudents,
        totalColleges: data.platformOverview.totalColleges,
        totalEmployers: data.platformOverview.totalEmployers,
        totalApplications: data.platformOverview.totalApplications,
        verifiedSelections: data.recruitmentOverview.totalVerifiedSelections,
      };

      if (format === 'CSV') {
        const headers = ['Domain', 'Metric', 'Value'];
        const rows = [
          ['Platform', 'Total Registered Students', data.platformOverview.totalStudents],
          ['Platform', 'Total Partner Colleges', data.platformOverview.totalColleges],
          ['Platform', 'Total Registered Employers', data.platformOverview.totalEmployers],
          ['Platform', 'Total Placement Drives', data.platformOverview.totalPlacementDrives],
          ['Platform', 'Total Applications', data.platformOverview.totalApplications],
          ['Recruitment', 'Shortlisted Applications', data.recruitmentOverview.totalShortlisted],
          ['Recruitment', 'Interviews Conducted', data.recruitmentOverview.totalInterviews],
          ['Recruitment', 'Verified Selections', data.recruitmentOverview.totalVerifiedSelections],
          ['Learning', 'Learning Path Enrollments', data.learningOverview.totalEnrollments],
          ['Learning', 'Completed Paths', data.learningOverview.pathCompletions],
          ['Mentorship', 'Total Verified Mentors', data.mentorshipOverview.verifiedMentors],
          ['Mentorship', 'Sessions Conducted', data.mentorshipOverview.totalSessionsConducted],
        ];
        fileContent = this.toCsvString(headers, rows);
      } else {
        fileContent = this.generatePdfTextDocument({
          title,
          reportId,
          scopeType: params.scopeType,
          scopeId: params.scopeId,
          period,
          generatedAt: timestamp,
          summary,
          sections: [
            {
              heading: 'Platform Ecosystem Metrics',
              items: [
                `Registered Students: ${data.platformOverview.totalStudents}`,
                `Partner Institutions: ${data.platformOverview.totalColleges}`,
                `Hiring Employers: ${data.platformOverview.totalEmployers}`,
                `Placement Applications: ${data.platformOverview.totalApplications}`,
                `Verified Selections: ${data.recruitmentOverview.totalVerifiedSelections}`,
              ],
            },
            {
              heading: 'Learning & Skill Empowerment',
              items: [
                `Learning Hub Enrollments: ${data.learningOverview.totalEnrollments}`,
                `Completed Learning Paths: ${data.learningOverview.pathCompletions}`,
                `Conducted Mentorship Sessions: ${data.mentorshipOverview.totalSessionsConducted}`,
              ],
            },
          ],
        });
      }
    }

    const ext = format === 'CSV' ? 'csv' : 'txt';
    const fileName = `${params.scopeType.toLowerCase()}_report_${params.scopeId.substring(0, 8)}_${period.toLowerCase()}.${ext}`;
    const fileSizeBytes = Buffer.byteLength(fileContent, 'utf-8');

    const reportRecord: ReportHistoryData = {
      id: reportId,
      title,
      reportType: params.reportType,
      format,
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      generatedBy: params.generatedBy,
      generatedAt: timestamp,
      period,
      filters: params.filter || {},
      summary,
      fileContent,
      fileName,
      fileSizeBytes,
      status: 'COMPLETED',
    };

    if (getDbStatus().status === 'connected') {
      try {
        await ReportHistory.create({
          reportId,
          title,
          reportType: params.reportType,
          format,
          scopeType: params.scopeType,
          scopeId: params.scopeId,
          generatedBy: params.generatedBy,
          generatedAt: new Date(timestamp),
          period,
          filters: params.filter || {},
          summary,
          fileContent,
          fileName,
          fileSizeBytes,
          status: 'COMPLETED',
        });
      } catch (err) {
        console.warn('Could not save report history in MongoDB, using in-memory store:', err);
      }
    }

    this.inMemoryReports.set(reportId, reportRecord);
    return reportRecord;
  }

  public async getReportById(reportId: string): Promise<ReportHistoryData | null> {
    if (this.inMemoryReports.has(reportId)) {
      return this.inMemoryReports.get(reportId)!;
    }

    if (getDbStatus().status === 'connected') {
      try {
        const doc = await ReportHistory.findOne({ reportId });
        if (doc) {
          return doc.toSafeObject();
        }
      } catch (err) {
        console.warn('Error fetching report from DB:', err);
      }
    }
    return null;
  }

  public async listReports(scopeType?: ReportScopeType, scopeId?: string): Promise<ReportHistoryData[]> {
    if (getDbStatus().status === 'connected') {
      try {
        const query: any = {};
        if (scopeType) query.scopeType = scopeType;
        if (scopeId) query.scopeId = scopeId;
        const docs = await ReportHistory.find(query).sort({ generatedAt: -1 }).limit(50);
        if (docs.length > 0) {
          return docs.map((d) => d.toSafeObject());
        }
      } catch (err) {
        console.warn('Error listing reports from DB:', err);
      }
    }

    const results = Array.from(this.inMemoryReports.values());
    return results.filter((r) => {
      if (scopeType && r.scopeType !== scopeType) return false;
      if (scopeId && r.scopeId !== scopeId) return false;
      return true;
    });
  }

  public async deleteReport(reportId: string): Promise<boolean> {
    this.inMemoryReports.delete(reportId);
    if (getDbStatus().status === 'connected') {
      try {
        await ReportHistory.deleteOne({ reportId });
      } catch (err) {
        console.warn('Error deleting report from DB:', err);
      }
    }
    return true;
  }

  public async createScheduledReport(params: {
    title: string;
    reportType: string;
    scopeType: ReportScopeType;
    scopeId: string;
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    format: ReportFormat;
    recipients: string[];
    filters?: Record<string, any>;
    createdBy: string;
  }): Promise<ScheduledReportData> {
    const scheduleId = `sched_${randomUUID().substring(0, 12)}`;
    const now = new Date();
    const nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const scheduleData: ScheduledReportData = {
      id: scheduleId,
      title: params.title,
      reportType: params.reportType,
      scopeType: params.scopeType,
      scopeId: params.scopeId,
      frequency: params.frequency,
      format: params.format,
      recipients: params.recipients || [],
      filters: params.filters || {},
      enabled: true,
      nextRunAt: nextRun.toISOString(),
      lastRunStatus: 'PENDING',
      createdBy: params.createdBy,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    if (getDbStatus().status === 'connected') {
      try {
        await ScheduledReport.create({
          scheduleId,
          ...params,
          nextRunAt: nextRun,
          lastRunStatus: 'PENDING',
          enabled: true,
        });
      } catch (err) {
        console.warn('Could not save scheduled report in MongoDB, using in-memory store:', err);
      }
    }

    this.inMemorySchedules.set(scheduleId, scheduleData);
    return scheduleData;
  }

  public async listScheduledReports(scopeType?: ReportScopeType, scopeId?: string): Promise<ScheduledReportData[]> {
    if (getDbStatus().status === 'connected') {
      try {
        const query: any = {};
        if (scopeType) query.scopeType = scopeType;
        if (scopeId) query.scopeId = scopeId;
        const docs = await ScheduledReport.find(query).sort({ createdAt: -1 });
        if (docs.length > 0) {
          return docs.map((d) => d.toSafeObject());
        }
      } catch (err) {
        console.warn('Error querying scheduled reports from DB:', err);
      }
    }

    return Array.from(this.inMemorySchedules.values()).filter((s) => {
      if (scopeType && s.scopeType !== scopeType) return false;
      if (scopeId && s.scopeId !== scopeId) return false;
      return true;
    });
  }

  public async updateScheduledReport(
    scheduleId: string,
    updates: Partial<ScheduledReportData>
  ): Promise<ScheduledReportData | null> {
    let existing = this.inMemorySchedules.get(scheduleId);

    if (getDbStatus().status === 'connected') {
      try {
        const doc = await ScheduledReport.findOne({ scheduleId });
        if (doc) {
          Object.assign(doc, updates);
          doc.updatedAt = new Date();
          await doc.save();
          existing = doc.toSafeObject();
        }
      } catch (err) {
        console.warn('Error updating scheduled report in DB:', err);
      }
    }

    if (existing) {
      const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      this.inMemorySchedules.set(scheduleId, merged);
      return merged;
    }
    return null;
  }

  public async deleteScheduledReport(scheduleId: string): Promise<boolean> {
    this.inMemorySchedules.delete(scheduleId);
    if (getDbStatus().status === 'connected') {
      try {
        await ScheduledReport.deleteOne({ scheduleId });
      } catch (err) {
        console.warn('Error deleting scheduled report from DB:', err);
      }
    }
    return true;
  }

  private generatePdfTextDocument(opts: {
    title: string;
    reportId: string;
    scopeType: string;
    scopeId: string;
    period: string;
    generatedAt: string;
    summary: Record<string, any>;
    sections: Array<{ heading: string; items: string[] }>;
  }): string {
    const lines: string[] = [];
    lines.push('================================================================================');
    lines.push(` CAREERBRIDGE ANALYTICS & REPORTING SYSTEM`);
    lines.push(` ${opts.title.toUpperCase()}`);
    lines.push('================================================================================');
    lines.push(`Report ID   : ${opts.reportId}`);
    lines.push(`Scope       : ${opts.scopeType} (${opts.scopeId})`);
    lines.push(`Period      : ${opts.period}`);
    lines.push(`Generated   : ${opts.generatedAt}`);
    lines.push('--------------------------------------------------------------------------------');
    lines.push('EXECUTIVE SUMMARY:');
    for (const [key, value] of Object.entries(opts.summary)) {
      lines.push(`  * ${key.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${value}`);
    }
    lines.push('--------------------------------------------------------------------------------');

    for (const sec of opts.sections) {
      lines.push('');
      lines.push(`[+] ${sec.heading.toUpperCase()}`);
      for (const item of sec.items) {
        lines.push(`    - ${item}`);
      }
    }

    lines.push('');
    lines.push('--------------------------------------------------------------------------------');
    lines.push('DATA INTEGRITY & METHODOLOGY NOTICE:');
    lines.push('1. All placement statistics strictly reflect verified database offer records.');
    lines.push('2. Shortlisted or interview statuses are never counted as confirmed selections.');
    lines.push('3. Institutional conversion funnel tracks unique students to prevent multi-application inflation.');
    lines.push('================================================================================');
    return lines.join('\n');
  }
}
