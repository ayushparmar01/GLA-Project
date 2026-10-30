import { Router } from 'express';
import {
  getRecommendedJobs,
  getRecommendationSummary,
  getSkillGapAnalysis,
  getJobRecommendationDetail,
  refreshRecommendations,
  getEmployerJobCandidates,
  getCollegePlacementIntelligence,
  getMatchingConfig,
  updateMatchingConfig,
  getMatchingAnalytics,
} from '../controllers/recommendation.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// ==========================================
// Specific non-param routes (Declared First)
// ==========================================

// Student Recommendation Views
router.get('/', authenticate, getRecommendedJobs);
router.get('/summary', authenticate, getRecommendationSummary);
router.get('/skill-gaps', authenticate, getSkillGapAnalysis);
router.post('/refresh', authenticate, refreshRecommendations);

// Employer Intelligence
router.get(
  '/employer/jobs/:jobId/candidates',
  authenticate,
  authorizeRole('EMPLOYER', 'ADMIN'),
  getEmployerJobCandidates
);

// College Placement Intelligence
router.get(
  '/college/placement-intelligence',
  authenticate,
  authorizeRole('COLLEGE', 'ADMIN'),
  getCollegePlacementIntelligence
);

// Admin Matching Config & Analytics
router.get(
  '/admin/config',
  authenticate,
  authorizeRole('ADMIN'),
  getMatchingConfig
);
router.put(
  '/admin/config',
  authenticate,
  authorizeRole('ADMIN'),
  updateMatchingConfig
);
router.get(
  '/admin/analytics',
  authenticate,
  authorizeRole('ADMIN'),
  getMatchingAnalytics
);

// Single Job Recommendation Detail (Declared after named subpaths)
router.get('/:jobId', authenticate, getJobRecommendationDetail);

export default router;
