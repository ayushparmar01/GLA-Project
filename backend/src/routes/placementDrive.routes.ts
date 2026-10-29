import { Router } from 'express';
import {
  createDrive,
  listDrives,
  getDriveById,
  updateDrive,
  publishDrive,
  closeDrive,
  cancelDrive,
  checkDriveEligibility,
} from '../controllers/placementDrive.controller.js';
import {
  applyToDrive,
  listDriveApplications,
} from '../controllers/application.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// List drives (Colleges see all their drives; Students see PUBLISHED open drives)
router.get('/', authenticate, listDrives);

// Create drive (College only)
router.post('/', authenticate, authorizeRole('COLLEGE'), createDrive);

// Get drive details (College owner or eligible Student)
router.get('/:driveId', authenticate, getDriveById);

// Update drive draft / parameters (College only)
router.patch('/:driveId', authenticate, authorizeRole('COLLEGE'), updateDrive);

// Publish drive (College only)
router.post('/:driveId/publish', authenticate, authorizeRole('COLLEGE'), publishDrive);

// Close drive (College only)
router.post('/:driveId/close', authenticate, authorizeRole('COLLEGE'), closeDrive);

// Cancel drive (College only)
router.post('/:driveId/cancel', authenticate, authorizeRole('COLLEGE'), cancelDrive);

// Check student eligibility for a drive (Student only)
router.get('/:driveId/eligibility', authenticate, authorizeRole('STUDENT'), checkDriveEligibility);

// Student apply to a placement drive
router.post('/:driveId/apply', authenticate, authorizeRole('STUDENT'), applyToDrive);

// College view applications for a drive
router.get('/:driveId/applications', authenticate, authorizeRole('COLLEGE'), listDriveApplications);

export default router;
