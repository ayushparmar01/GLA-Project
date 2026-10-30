import { Router } from 'express';
import {
  createInterviewSession,
  listStudentInterviewSessions,
  getInterviewSessionById,
  startInterviewSession,
  saveQuestionAnswer,
  submitInterviewSession,
  consultInterviewCoach,
  getStudentInterviewAnalytics,
  getPersonalizedInterviewRoadmap,
  listQuestionBank,
  getCollegeInterviewAnalytics,
  createAdminQuestion,
  updateAdminQuestion,
  deleteAdminQuestion,
  getAdminInterviewAnalytics,
} from '../controllers/mockInterview.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// ==========================================
// Specific non-param routes (Declared First)
// ==========================================

// Student Mock Interview Endpoints
router.post('/sessions', authenticate, authorizeRole('STUDENT'), createInterviewSession);
router.get('/sessions', authenticate, authorizeRole('STUDENT'), listStudentInterviewSessions);
router.post('/coach', authenticate, authorizeRole('STUDENT'), consultInterviewCoach);
router.get('/analytics', authenticate, authorizeRole('STUDENT'), getStudentInterviewAnalytics);
router.get('/roadmap', authenticate, authorizeRole('STUDENT'), getPersonalizedInterviewRoadmap);
router.get('/questions', authenticate, listQuestionBank);

// College Placement Analytics
router.get(
  '/college/analytics',
  authenticate,
  authorizeRole('COLLEGE', 'ADMIN'),
  getCollegeInterviewAnalytics
);

// Admin Question Management & Analytics
router.post(
  '/admin/questions',
  authenticate,
  authorizeRole('ADMIN'),
  createAdminQuestion
);
router.patch(
  '/admin/questions/:questionId',
  authenticate,
  authorizeRole('ADMIN'),
  updateAdminQuestion
);
router.delete(
  '/admin/questions/:questionId',
  authenticate,
  authorizeRole('ADMIN'),
  deleteAdminQuestion
);
router.get(
  '/admin/analytics',
  authenticate,
  authorizeRole('ADMIN'),
  getAdminInterviewAnalytics
);

// Session Parameterized Lifecycle Endpoints (Declared After Named Paths)
router.get('/sessions/:sessionId', authenticate, authorizeRole('STUDENT'), getInterviewSessionById);
router.post('/sessions/:sessionId/start', authenticate, authorizeRole('STUDENT'), startInterviewSession);
router.post('/sessions/:sessionId/answers', authenticate, authorizeRole('STUDENT'), saveQuestionAnswer);
router.post('/sessions/:sessionId/submit', authenticate, authorizeRole('STUDENT'), submitInterviewSession);

export default router;
