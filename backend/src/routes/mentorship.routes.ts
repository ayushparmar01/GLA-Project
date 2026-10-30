import { Router } from 'express';
import { MentorshipController } from '../controllers/mentorship.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// ==========================================
// 1. PUBLIC / DISCOVERY ROUTES
// ==========================================
router.get('/mentors', MentorshipController.listMentors);
router.get('/mentors/:mentorProfileId', MentorshipController.getMentorById);
router.get('/mentors/:mentorProfileId/feedback', MentorshipController.getMentorFeedback);
router.get('/groups', MentorshipController.listGroupSessions);

// ==========================================
// 2. STUDENT SPECIFIC ROUTES
// ==========================================
router.get(
  '/recommendations',
  authenticate,
  authorizeRole('STUDENT'),
  MentorshipController.getRecommendations
);
router.get(
  '/profile/student',
  authenticate,
  authorizeRole('STUDENT'),
  MentorshipController.getStudentMentorshipProfile
);
router.put(
  '/profile/student',
  authenticate,
  authorizeRole('STUDENT'),
  MentorshipController.updateStudentMentorshipProfile
);
router.post(
  '/requests',
  authenticate,
  authorizeRole('STUDENT'),
  MentorshipController.createRequest
);
router.get(
  '/requests/outgoing',
  authenticate,
  authorizeRole('STUDENT'),
  MentorshipController.listOutgoingRequests
);
router.post(
  '/groups/:groupId/join',
  authenticate,
  authorizeRole('STUDENT'),
  MentorshipController.joinGroupSession
);
router.post(
  '/groups/:groupId/leave',
  authenticate,
  authorizeRole('STUDENT'),
  MentorshipController.leaveGroupSession
);

// ==========================================
// 3. MENTOR SPECIFIC ROUTES
// ==========================================
router.get('/profile/mentor/me', authenticate, MentorshipController.getMyMentorProfile);
router.post('/profile/mentor', authenticate, MentorshipController.upsertMentorProfile);
router.get('/requests/incoming', authenticate, MentorshipController.listIncomingRequests);
router.patch('/requests/:requestId/respond', authenticate, MentorshipController.respondToRequest);
router.post('/groups', authenticate, MentorshipController.createGroupSession);

// ==========================================
// 4. SHARED WORKSPACE (STUDENT & MENTOR)
// ==========================================
router.get('/relationships', authenticate, MentorshipController.listRelationships);
router.get('/relationships/:relationshipId', authenticate, MentorshipController.getRelationshipById);
router.patch('/relationships/:relationshipId/status', authenticate, MentorshipController.updateRelationshipStatus);

// Goals
router.get('/relationships/:relationshipId/goals', authenticate, MentorshipController.listGoals);
router.post('/relationships/:relationshipId/goals', authenticate, MentorshipController.createGoal);
router.patch('/relationships/:relationshipId/goals/:goalId', authenticate, MentorshipController.updateGoal);
router.delete('/relationships/:relationshipId/goals/:goalId', authenticate, MentorshipController.deleteGoal);

// Sessions
router.get('/relationships/:relationshipId/sessions', authenticate, MentorshipController.listSessions);
router.post('/relationships/:relationshipId/sessions', authenticate, MentorshipController.scheduleSession);
router.patch(
  '/relationships/:relationshipId/sessions/:sessionId/status',
  authenticate,
  MentorshipController.updateSessionStatus
);

// Messaging & Notes
router.get('/relationships/:relationshipId/messages', authenticate, MentorshipController.getMessages);
router.post('/relationships/:relationshipId/messages', authenticate, MentorshipController.sendMessage);
router.get('/relationships/:relationshipId/notes', authenticate, MentorshipController.getNotes);
router.post('/relationships/:relationshipId/notes', authenticate, MentorshipController.createNote);
router.delete('/relationships/:relationshipId/notes/:noteId', authenticate, MentorshipController.deleteNote);

// Feedback
router.post('/relationships/:relationshipId/feedback', authenticate, MentorshipController.submitFeedback);

// ==========================================
// 5. AI ASSISTANT ROUTES
// ==========================================
router.post('/ai/prepare-agenda', authenticate, MentorshipController.prepareAgenda);
router.post('/ai/suggest-questions', authenticate, MentorshipController.suggestQuestions);
router.post('/ai/summarize-notes', authenticate, MentorshipController.summarizeNotes);

// ==========================================
// 6. COLLEGE COORDINATOR ROUTES
// ==========================================
router.get(
  '/college/analytics',
  authenticate,
  authorizeRole('COLLEGE'),
  MentorshipController.getCollegeAnalytics
);

// ==========================================
// 7. PLATFORM ADMIN GOVERNANCE ROUTES
// ==========================================
router.get(
  '/admin/verifications',
  authenticate,
  authorizeRole('ADMIN'),
  MentorshipController.getAdminVerificationQueue
);
router.patch(
  '/admin/verifications/:mentorProfileId',
  authenticate,
  authorizeRole('ADMIN'),
  MentorshipController.reviewMentorVerification
);
router.get(
  '/admin/analytics',
  authenticate,
  authorizeRole('ADMIN'),
  MentorshipController.getAdminAnalytics
);

export default router;
