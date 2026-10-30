import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import { aiRateLimiter } from '../middlewares/rateLimiter.js';
import {
  postCareerGuidance,
  getConversations,
  getConversationById,
  postResumeFeedback,
  getInterviewQuestions,
  evaluateInterviewAnswer,
} from '../controllers/aiGuidance.controller.js';

const router = Router();

// Apply AI rate limiting to prevent model inference quota exhaustion
router.use(aiRateLimiter);

// All AI guidance endpoints require STUDENT authentication
router.post('/career-guidance', authenticate, authorizeRole('STUDENT'), postCareerGuidance);
router.get('/conversations', authenticate, authorizeRole('STUDENT'), getConversations);
router.get('/conversations/:id', authenticate, authorizeRole('STUDENT'), getConversationById);
router.post('/resume-feedback', authenticate, authorizeRole('STUDENT'), postResumeFeedback);
router.get('/interview-questions', authenticate, authorizeRole('STUDENT'), getInterviewQuestions);
router.post('/interview-preparation', authenticate, authorizeRole('STUDENT'), evaluateInterviewAnswer);

export default router;
