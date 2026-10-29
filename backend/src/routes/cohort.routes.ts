import { Router } from 'express';
import {
  createCohort,
  listCohorts,
  getCohortById,
  updateCohort,
  archiveCohort,
  listCohortStudents,
  enrollStudent,
  removeStudent,
} from '../controllers/cohort.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// List cohorts (Colleges see theirs, Students see enrolled ones)
router.get('/', authenticate, listCohorts);

// Create cohort (College only)
router.post('/', authenticate, authorizeRole('COLLEGE'), createCohort);

// Get specific cohort details (College owner or enrolled Student)
router.get('/:cohortId', authenticate, getCohortById);

// Update cohort metadata (College only)
router.patch('/:cohortId', authenticate, authorizeRole('COLLEGE'), updateCohort);

// Archive cohort (College only)
router.post('/:cohortId/archive', authenticate, authorizeRole('COLLEGE'), archiveCohort);

// List cohort members (College only)
router.get('/:cohortId/students', authenticate, authorizeRole('COLLEGE'), listCohortStudents);

// Enroll student by email (College only)
router.post('/:cohortId/students', authenticate, authorizeRole('COLLEGE'), enrollStudent);

// Remove student from cohort (College only)
router.delete('/:cohortId/students/:studentId', authenticate, authorizeRole('COLLEGE'), removeStudent);

export default router;
