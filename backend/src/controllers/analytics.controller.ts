import { Request, Response } from 'express';
import { MetricsDefinitionService } from '../services/metricsDefinition.service.js';
import { StudentAnalyticsService } from '../services/studentAnalytics.service.js';
import { CollegeAnalyticsService } from '../services/collegeAnalytics.service.js';
import { EmployerAnalyticsService } from '../services/employerAnalytics.service.js';
import { AdminAnalyticsService } from '../services/adminAnalytics.service.js';
import { ReportExportService } from '../services/reportExport.service.js';
import { AnalyticsDateFilter, ReportScopeType, ReportFormat } from '../types/index.js';

function extractDateFilter(req: Request): AnalyticsDateFilter | undefined {
  const { preset, from, to } = req.query;
  if (!preset && !from && !to) return undefined;

  return {
    preset: (preset as any) || (from && to ? 'CUSTOM' : '30D'),
    from: from ? String(from) : undefined,
    to: to ? String(to) : undefined,
  };
}

export const getMetricsDefinitions = async (_req: Request, res: Response): Promise<void> => {
  try {
    const definitions = MetricsDefinitionService.getAllDefinitions();
    res.json({
      success: true,
      data: definitions,
    });
  } catch (error) {
    console.error('[AnalyticsController] getMetricsDefinitions failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve metrics definitions.' },
    });
  }
};

export const getStudentAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    let studentId = req.user?.userId;

    if (userRole === 'ADMIN' && req.query.studentId) {
      studentId = String(req.query.studentId);
    }

    if (!studentId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Missing student identifier.' },
      });
      return;
    }

    const filter = extractDateFilter(req);
    const analytics = await StudentAnalyticsService.getInstance().getStudentAnalytics(studentId, filter);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('[AnalyticsController] getStudentAnalytics failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to generate student career analytics.' },
    });
  }
};

export const getCollegeAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    let collegeId = req.user?.userId;

    if (userRole === 'ADMIN' && req.query.collegeId) {
      collegeId = String(req.query.collegeId);
    }

    if (!collegeId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Missing college identifier.' },
      });
      return;
    }

    const filter = extractDateFilter(req);
    const analytics = await CollegeAnalyticsService.getInstance().getCollegeAnalytics(collegeId, filter);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('[AnalyticsController] getCollegeAnalytics failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to generate college placement analytics.' },
    });
  }
};

export const getCollegeFunnel = async (req: Request, res: Response): Promise<void> => {
  try {
    const collegeId = req.user?.userId || String(req.query.collegeId || '');
    const filter = extractDateFilter(req);
    const analytics = await CollegeAnalyticsService.getInstance().getCollegeAnalytics(collegeId, filter);

    res.json({
      success: true,
      data: analytics.placementFunnel,
    });
  } catch (error) {
    console.error('[AnalyticsController] getCollegeFunnel failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve college placement funnel.' },
    });
  }
};

export const getCollegeSkillGaps = async (req: Request, res: Response): Promise<void> => {
  try {
    const collegeId = req.user?.userId || String(req.query.collegeId || '');
    const filter = extractDateFilter(req);
    const analytics = await CollegeAnalyticsService.getInstance().getCollegeAnalytics(collegeId, filter);

    res.json({
      success: true,
      data: analytics.skillGapAnalytics,
    });
  } catch (error) {
    console.error('[AnalyticsController] getCollegeSkillGaps failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve college skill gaps.' },
    });
  }
};

export const getEmployerAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    let employerId = req.user?.userId;

    if (userRole === 'ADMIN' && req.query.employerId) {
      employerId = String(req.query.employerId);
    }

    if (!employerId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Missing employer identifier.' },
      });
      return;
    }

    const filter = extractDateFilter(req);
    const analytics = await EmployerAnalyticsService.getInstance().getEmployerAnalytics(employerId, filter);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('[AnalyticsController] getEmployerAnalytics failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to generate employer recruitment analytics.' },
    });
  }
};

export const getEmployerJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const employerId = req.user?.userId || String(req.query.employerId || '');
    const filter = extractDateFilter(req);
    const analytics = await EmployerAnalyticsService.getInstance().getEmployerAnalytics(employerId, filter);

    res.json({
      success: true,
      data: analytics.jobPerformance,
    });
  } catch (error) {
    console.error('[AnalyticsController] getEmployerJobs failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve employer job performance.' },
    });
  }
};

export const getEmployerFunnel = async (req: Request, res: Response): Promise<void> => {
  try {
    const employerId = req.user?.userId || String(req.query.employerId || '');
    const filter = extractDateFilter(req);
    const analytics = await EmployerAnalyticsService.getInstance().getEmployerAnalytics(employerId, filter);

    res.json({
      success: true,
      data: analytics.recruitmentFunnel,
    });
  } catch (error) {
    console.error('[AnalyticsController] getEmployerFunnel failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve recruitment funnel.' },
    });
  }
};

export const getAdminAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = extractDateFilter(req);
    const analytics = await AdminAnalyticsService.getInstance().getAdminAnalytics(filter);

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('[AnalyticsController] getAdminAnalytics failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to generate platform governance analytics.' },
    });
  }
};

export const getAdminUserGrowth = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = extractDateFilter(req);
    const analytics = await AdminAnalyticsService.getInstance().getAdminAnalytics(filter);

    res.json({
      success: true,
      data: analytics.userGrowth,
    });
  } catch (error) {
    console.error('[AnalyticsController] getAdminUserGrowth failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve user growth analytics.' },
    });
  }
};

export const getAdminSystemHealth = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter = extractDateFilter(req);
    const analytics = await AdminAnalyticsService.getInstance().getAdminAnalytics(filter);

    res.json({
      success: true,
      data: analytics.systemHealthTelemetry,
    });
  } catch (error) {
    console.error('[AnalyticsController] getAdminSystemHealth failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve system health telemetry.' },
    });
  }
};

export const generateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, reportType, format = 'CSV', scopeType, scopeId, filter } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    // Multi-tenant permission guard
    if (userRole !== 'ADMIN') {
      if (scopeType === 'STUDENT' && scopeId !== userId) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot generate report for another student.' } });
        return;
      }
      if (scopeType === 'COLLEGE' && scopeId !== userId) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot generate report for another college.' } });
        return;
      }
      if (scopeType === 'EMPLOYER' && scopeId !== userId) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Cannot generate report for another employer.' } });
        return;
      }
      if (scopeType === 'ADMIN') {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin privileges required.' } });
        return;
      }
    }

    const report = await ReportExportService.getInstance().generateReport({
      title,
      reportType: reportType || 'ANALYTICS_EXPORT',
      format: (format.toUpperCase() as ReportFormat) || 'CSV',
      scopeType: (scopeType as ReportScopeType) || (userRole as ReportScopeType),
      scopeId: scopeId || userId || 'system',
      generatedBy: userId || 'system',
      filter,
    });

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('[AnalyticsController] generateReport failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to generate report export.' },
    });
  }
};

export const listReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    let scopeType: ReportScopeType | undefined = userRole as ReportScopeType;
    let scopeId: string | undefined = userId;

    if (userRole === 'ADMIN') {
      scopeType = req.query.scopeType ? (String(req.query.scopeType) as ReportScopeType) : undefined;
      scopeId = req.query.scopeId ? String(req.query.scopeId) : undefined;
    }

    const reports = await ReportExportService.getInstance().listReports(scopeType, scopeId);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('[AnalyticsController] listReports failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to list reports.' },
    });
  }
};

export const downloadReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    const report = await ReportExportService.getInstance().getReportById(reportId);
    if (!report) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Report not found.' },
      });
      return;
    }

    // Authorization check
    if (userRole !== 'ADMIN' && report.scopeId !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Unauthorized to download this report.' },
      });
      return;
    }

    if (report.format === 'CSV') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    } else {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    }

    res.send(report.fileContent);
  } catch (error) {
    console.error('[AnalyticsController] downloadReport failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to download report.' },
    });
  }
};

export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportId } = req.params;
    await ReportExportService.getInstance().deleteReport(reportId);

    res.json({
      success: true,
      data: { message: 'Report deleted successfully.' },
    });
  } catch (error) {
    console.error('[AnalyticsController] deleteReport failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete report.' },
    });
  }
};

export const listSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    let scopeType: ReportScopeType | undefined = userRole as ReportScopeType;
    let scopeId: string | undefined = userId;

    if (userRole === 'ADMIN') {
      scopeType = req.query.scopeType ? (String(req.query.scopeType) as ReportScopeType) : undefined;
      scopeId = req.query.scopeId ? String(req.query.scopeId) : undefined;
    }

    const schedules = await ReportExportService.getInstance().listScheduledReports(scopeType, scopeId);

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    console.error('[AnalyticsController] listSchedules failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to list scheduled reports.' },
    });
  }
};

export const createSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, reportType, scopeType, scopeId, frequency, format, recipients, filters } = req.body;
    const userRole = req.user?.role;
    const userId = req.user?.userId;

    if (!title || !frequency || !format) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Title, frequency, and format are required.' },
      });
      return;
    }

    const schedule = await ReportExportService.getInstance().createScheduledReport({
      title,
      reportType: reportType || 'SCHEDULED_ANALYTICS',
      scopeType: (scopeType as ReportScopeType) || (userRole as ReportScopeType),
      scopeId: scopeId || userId || 'system',
      frequency,
      format,
      recipients: recipients || [],
      filters: filters || {},
      createdBy: userId || 'system',
    });

    res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('[AnalyticsController] createSchedule failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to create report schedule.' },
    });
  }
};

export const updateSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scheduleId } = req.params;
    const updated = await ReportExportService.getInstance().updateScheduledReport(scheduleId, req.body);

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scheduled report not found.' },
      });
      return;
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[AnalyticsController] updateSchedule failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update report schedule.' },
    });
  }
};

export const deleteSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scheduleId } = req.params;
    await ReportExportService.getInstance().deleteScheduledReport(scheduleId);

    res.json({
      success: true,
      data: { message: 'Schedule deleted successfully.' },
    });
  } catch (error) {
    console.error('[AnalyticsController] deleteSchedule failed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete report schedule.' },
    });
  }
};
