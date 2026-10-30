import { Router } from 'express';
import express from 'express';
import { ResumeAnalyzerController } from '../controllers/resumeAnalyzer.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { aiRateLimiter, expensiveOperationLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Route-specific 6MB JSON body parser for resume uploads
const uploadParser = express.json({ limit: '6mb' });

// 1. Resume Upload & Document Management
router.post('/upload', authenticate, uploadParser, ResumeAnalyzerController.uploadResume);
router.get('/documents', authenticate, ResumeAnalyzerController.listDocuments);
router.get('/documents/:id', authenticate, ResumeAnalyzerController.getDocument);
router.delete('/documents/:id', authenticate, ResumeAnalyzerController.deleteDocument);

// 2. ATS Analysis
router.post('/analyze', authenticate, aiRateLimiter, ResumeAnalyzerController.analyzeResume);
router.get('/analyses', authenticate, ResumeAnalyzerController.listAnalyses);
router.get('/analyses/:id', authenticate, ResumeAnalyzerController.getAnalysis);

// 3. AI Suggestions & Improvements
router.get('/analyses/:id/suggestions', authenticate, ResumeAnalyzerController.listSuggestions);
router.patch('/suggestions/:id', authenticate, ResumeAnalyzerController.updateSuggestionStatus);

// 4. Resume Versions
router.post('/versions', authenticate, ResumeAnalyzerController.createVersion);
router.get('/versions/:documentId', authenticate, ResumeAnalyzerController.listVersions);

// 5. PDF Export
router.post('/export-improved-pdf', authenticate, expensiveOperationLimiter, ResumeAnalyzerController.exportImprovedPdf);

// 6. Role-Specific Institutional & Employer Endpoints
router.get(
  '/college/analytics',
  authenticate,
  authorizeRole('COLLEGE', 'ADMIN'),
  ResumeAnalyzerController.getCollegeAnalytics
);

router.get(
  '/employer/candidate-resume/:applicationId',
  authenticate,
  authorizeRole('EMPLOYER', 'ADMIN'),
  ResumeAnalyzerController.getEmployerCandidateResume
);

export default router;
