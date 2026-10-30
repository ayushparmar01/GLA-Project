import { Router } from 'express';
import {
  createEmployerProfile,
  getMyEmployerProfile,
  updateMyEmployerProfile,
  getPublicEmployerProfile,
  verifyEmployerProfile,
} from '../controllers/employerProfile.controller.js';
import { getEmployerDashboard } from '../controllers/employerDashboard.controller.js';
import {
  createEmployerOpportunity,
  listEmployerOpportunities,
  getEmployerOpportunityById,
  updateEmployerOpportunity,
  publishEmployerOpportunity,
  closeEmployerOpportunity,
  cancelEmployerOpportunity,
} from '../controllers/employerOpportunity.controller.js';
import {
  createConnectionRequest,
  listEmployerConnections,
} from '../controllers/collegeConnection.controller.js';
import {
  listEmployerApplications,
  listOpportunityApplications,
  getEmployerApplicationById,
  updateApplicationStatusByEmployer,
} from '../controllers/employerApplication.controller.js';
import { downloadEmployerCandidateResume } from '../controllers/resume.controller.js';
import {
  scheduleInterview,
  listEmployerInterviews,
  updateInterview,
  cancelInterview,
} from '../controllers/interview.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// ==========================================
// 1. COMPANY PROFILE
// ==========================================
router.post('/profile', authenticate, authorizeRole('EMPLOYER'), createEmployerProfile);
router.get('/profile/me', authenticate, authorizeRole('EMPLOYER'), getMyEmployerProfile);
router.patch('/profile/me', authenticate, authorizeRole('EMPLOYER'), updateMyEmployerProfile);

// ==========================================
// 2. REAL DATABASE EMPLOYER DASHBOARD
// ==========================================
router.get('/dashboard', authenticate, authorizeRole('EMPLOYER'), getEmployerDashboard);
router.get('/dashboard/stats', authenticate, authorizeRole('EMPLOYER'), getEmployerDashboard);

// ==========================================
// 3. PLACEMENT OPPORTUNITIES
// ==========================================
router.post('/opportunities', authenticate, authorizeRole('EMPLOYER'), createEmployerOpportunity);
router.get('/opportunities', authenticate, authorizeRole('EMPLOYER'), listEmployerOpportunities);
router.get('/opportunities/:driveId', authenticate, authorizeRole('EMPLOYER'), getEmployerOpportunityById);
router.patch('/opportunities/:driveId', authenticate, authorizeRole('EMPLOYER'), updateEmployerOpportunity);
router.post('/opportunities/:driveId/publish', authenticate, authorizeRole('EMPLOYER'), publishEmployerOpportunity);
router.post('/opportunities/:driveId/close', authenticate, authorizeRole('EMPLOYER'), closeEmployerOpportunity);
router.post('/opportunities/:driveId/cancel', authenticate, authorizeRole('EMPLOYER'), cancelEmployerOpportunity);

// ==========================================
// 4. COLLEGE CONNECTIONS (EMPLOYER SIDE)
// ==========================================
router.post('/connections', authenticate, authorizeRole('EMPLOYER'), createConnectionRequest);
router.get('/connections', authenticate, authorizeRole('EMPLOYER'), listEmployerConnections);

// ==========================================
// 5. APPLICANT REVIEW & RECRUITMENT STATUS
// ==========================================
router.get('/applications', authenticate, authorizeRole('EMPLOYER'), listEmployerApplications);
router.get('/opportunities/:driveId/applications', authenticate, authorizeRole('EMPLOYER'), listOpportunityApplications);
router.get('/applications/:applicationId', authenticate, authorizeRole('EMPLOYER'), getEmployerApplicationById);
router.get('/applications/:applicationId/resume', authenticate, authorizeRole('EMPLOYER'), downloadEmployerCandidateResume);
router.patch('/applications/:applicationId/status', authenticate, authorizeRole('EMPLOYER'), updateApplicationStatusByEmployer);

// ==========================================
// 6. INTERVIEW SCHEDULING
// ==========================================
router.post('/applications/:applicationId/interviews', authenticate, authorizeRole('EMPLOYER'), scheduleInterview);
router.post('/interviews', authenticate, authorizeRole('EMPLOYER'), scheduleInterview);
router.get('/interviews', authenticate, authorizeRole('EMPLOYER'), listEmployerInterviews);
router.patch('/interviews/:interviewId', authenticate, authorizeRole('EMPLOYER'), updateInterview);
router.patch('/interviews/:interviewId/reschedule', authenticate, authorizeRole('EMPLOYER'), updateInterview);
router.patch('/interviews/:interviewId/cancel', authenticate, authorizeRole('EMPLOYER'), cancelInterview);
router.post('/interviews/:interviewId/cancel', authenticate, authorizeRole('EMPLOYER'), cancelInterview);

// ==========================================
// 7. PUBLIC EMPLOYER PROFILE & VERIFICATION
// Note: Parameterized routes placed at end
// ==========================================
router.patch('/:employerId/verify', authenticate, authorizeRole('COLLEGE'), verifyEmployerProfile);
router.get('/:employerId', getPublicEmployerProfile);

export default router;
