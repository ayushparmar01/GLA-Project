import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// List assessments (sanitized questions)
router.get('/', AssessmentController.listAssessments);

// Student's assessment history
router.get('/my-history', authenticate, authorizeRole('STUDENT'), AssessmentController.getMyAssessmentHistory);

// Single assessment overview / instructions (sanitized questions)
router.get('/:assessmentId', AssessmentController.getAssessmentById);

// Attempt lifecycle
router.post('/:assessmentId/attempts', authenticate, authorizeRole('STUDENT'), AssessmentController.startAttempt);
router.patch(
  '/:assessmentId/attempts/:attemptId/answers',
  authenticate,
  authorizeRole('STUDENT'),
  AssessmentController.saveAnswers
);
router.post(
  '/:assessmentId/attempts/:attemptId/submit',
  authenticate,
  authorizeRole('STUDENT'),
  AssessmentController.submitAttempt
);

export default router;
