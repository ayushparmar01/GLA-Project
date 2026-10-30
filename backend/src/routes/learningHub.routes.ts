import { Router } from 'express';
import {
  getDashboard,
  listResources,
  getResourceDetail,
  toggleBookmark,
  listBookmarks,
  reportResource,
  listLearningPaths,
  getPathDetail,
  enrollPath,
  updateModuleProgress,
  getQuiz,
  submitQuiz,
  getRecommendations,
  getSkillGapMapping,
  getCollegeAnalytics,
  adminListReports,
  adminResolveReport,
  adminVerifyResource,
  adminUpsertResource,
  adminSeedInitialData,
} from '../controllers/learningHub.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// Student Learning Hub Dashboard
router.get('/dashboard', authenticate, authorizeRole('STUDENT'), getDashboard);

// Resource Library Browsing & Detail
router.get('/resources', listResources);
router.get('/resources/:resourceId', getResourceDetail);

// Bookmarks & Personal Notes
router.get('/bookmarks', authenticate, authorizeRole('STUDENT'), listBookmarks);
router.post('/resources/:resourceId/bookmark', authenticate, authorizeRole('STUDENT'), toggleBookmark);

// Content Reporting
router.post('/resources/:resourceId/report', authenticate, authorizeRole('STUDENT'), reportResource);

// Structured Learning Paths
router.get('/paths', listLearningPaths);
router.get('/paths/:pathId', getPathDetail);
router.post('/paths/:pathId/enroll', authenticate, authorizeRole('STUDENT'), enrollPath);
router.patch(
  '/paths/:pathId/modules/:moduleId/progress',
  authenticate,
  authorizeRole('STUDENT'),
  updateModuleProgress
);

// Practice & Knowledge Checks (Quizzes)
router.get('/quizzes/:quizId', getQuiz);
router.post('/quizzes/:quizId/submit', authenticate, authorizeRole('STUDENT'), submitQuiz);

// AI-Powered Recommendations & Skill Gap Mapping
router.get('/recommendations', authenticate, getRecommendations);
router.get('/skill-gap-map', authenticate, getSkillGapMapping);

// College Institutional Analytics
router.get(
  '/college/analytics',
  authenticate,
  authorizeRole('COLLEGE', 'ADMIN'),
  getCollegeAnalytics
);

// Admin Control & Verification Desk
router.get('/admin/reports', authenticate, authorizeRole('ADMIN'), adminListReports);
router.patch('/admin/reports/:reportId/resolve', authenticate, authorizeRole('ADMIN'), adminResolveReport);
router.patch('/admin/resources/:resourceId/verify', authenticate, authorizeRole('ADMIN'), adminVerifyResource);
router.post('/admin/resources', authenticate, authorizeRole('ADMIN'), adminUpsertResource);
router.post('/admin/seed', authenticate, authorizeRole('ADMIN'), adminSeedInitialData);

export default router;
