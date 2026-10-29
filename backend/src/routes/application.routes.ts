import { Router } from 'express';
import {
  listMyApplications,
  updateApplicationStatus,
  withdrawApplication,
} from '../controllers/application.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// Student view own applications
router.get('/me', authenticate, authorizeRole('STUDENT'), listMyApplications);

// College update application status (Shortlist, Interview, Select, Reject)
router.patch('/:applicationId/status', authenticate, authorizeRole('COLLEGE'), updateApplicationStatus);

// Student withdraw own application
router.post('/:applicationId/withdraw', authenticate, authorizeRole('STUDENT'), withdrawApplication);

export default router;
