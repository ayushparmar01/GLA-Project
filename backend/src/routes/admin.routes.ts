import { Router } from 'express';
import {
  getDashboardMetrics,
  listUsers,
  getUserById,
  suspendUser,
  reactivateUser,
  listPendingEmployers,
  verifyEmployer,
  rejectEmployer,
  listColleges,
  verifyCollege,
  listModerationItems,
  createModerationItem,
  reviewModerationItem,
  getPlatformAnalytics,
  getPlacementReports,
  listAuditLogs,
  getSystemHealth,
} from '../controllers/admin.controller.js';
import {
  adminListReports,
  adminResolveReport,
  adminVerifyResource,
  adminUpsertResource,
  adminSeedInitialData,
} from '../controllers/learningHub.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// Flagging an item can be done by any authenticated user
router.post('/moderation', authenticate, createModerationItem);

// All subsequent routes require ADMIN role strictly
router.use(authenticate, authorizeRole('ADMIN'));

router.get('/dashboard', getDashboardMetrics);

// User Management
router.get('/users', listUsers);
router.get('/users/:userId', getUserById);
router.post('/users/:userId/suspend', suspendUser);
router.post('/users/:userId/reactivate', reactivateUser);

// Employer Verification
router.get('/employers/pending', listPendingEmployers);
router.post('/employers/:employerId/verify', verifyEmployer);
router.post('/employers/:employerId/reject', rejectEmployer);

// College Management
router.get('/colleges', listColleges);
router.post('/colleges/:collegeId/verify', verifyCollege);

// Content Moderation
router.get('/moderation', listModerationItems);
router.post('/moderation/:id/review', reviewModerationItem);

// Analytics & Placement Reporting
router.get('/analytics', getPlatformAnalytics);
router.get('/placement-reports', getPlacementReports);

// Audit Logging & Diagnostics
router.get('/audit-logs', listAuditLogs);
router.get('/system-health', getSystemHealth);

// Phase 17 Learning Hub Admin Desk
router.get('/learning/reports', adminListReports);
router.patch('/learning/reports/:reportId/resolve', adminResolveReport);
router.patch('/learning/resources/:resourceId/verify', adminVerifyResource);
router.post('/learning/resources', adminUpsertResource);
router.post('/learning/seed', adminSeedInitialData);

export default router;
