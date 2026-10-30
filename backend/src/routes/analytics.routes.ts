import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { expensiveOperationLimiter } from '../middlewares/rateLimiter.js';
import {
  getMetricsDefinitions,
  getStudentAnalytics,
  getCollegeAnalytics,
  getCollegeFunnel,
  getCollegeSkillGaps,
  getEmployerAnalytics,
  getEmployerJobs,
  getEmployerFunnel,
  getAdminAnalytics,
  getAdminUserGrowth,
  getAdminSystemHealth,
  generateReport,
  listReports,
  downloadReport,
  deleteReport,
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../controllers/analytics.controller.js';

const router = Router();

// Metric definitions (public/transparent definition layer)
router.get('/metrics-definitions', getMetricsDefinitions);

// Student Career Analytics (strictly isolated to student or Admin)
router.get('/student', authenticate, authorizeRole('STUDENT', 'ADMIN'), getStudentAnalytics);

// College Placement & Skill Gap Analytics (strictly isolated to College or Admin)
router.get('/college', authenticate, authorizeRole('COLLEGE', 'ADMIN'), getCollegeAnalytics);
router.get('/college/funnel', authenticate, authorizeRole('COLLEGE', 'ADMIN'), getCollegeFunnel);
router.get('/college/skill-gaps', authenticate, authorizeRole('COLLEGE', 'ADMIN'), getCollegeSkillGaps);

// Employer Recruitment Analytics (strictly isolated to Employer or Admin)
router.get('/employer', authenticate, authorizeRole('EMPLOYER', 'ADMIN'), getEmployerAnalytics);
router.get('/employer/jobs', authenticate, authorizeRole('EMPLOYER', 'ADMIN'), getEmployerJobs);
router.get('/employer/funnel', authenticate, authorizeRole('EMPLOYER', 'ADMIN'), getEmployerFunnel);

// Super-Admin Platform Analytics (Platform Governance & Health)
router.get('/admin', authenticate, authorizeRole('ADMIN'), getAdminAnalytics);
router.get('/admin/user-growth', authenticate, authorizeRole('ADMIN'), getAdminUserGrowth);
router.get('/admin/system-health', authenticate, authorizeRole('ADMIN'), getAdminSystemHealth);

// Report Generation & Export Engine
router.post('/reports/generate', authenticate, expensiveOperationLimiter, generateReport);
router.get('/reports', authenticate, listReports);
router.get('/reports/:reportId/download', authenticate, expensiveOperationLimiter, downloadReport);
router.delete('/reports/:reportId', authenticate, deleteReport);

// Scheduled Automated Reports
router.get('/schedules', authenticate, listSchedules);
router.post('/schedules', authenticate, createSchedule);
router.put('/schedules/:scheduleId', authenticate, updateSchedule);
router.delete('/schedules/:scheduleId', authenticate, deleteSchedule);

export default router;
