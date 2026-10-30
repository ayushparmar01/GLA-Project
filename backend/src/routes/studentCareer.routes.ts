import { Router } from 'express';
import {
  getCareerProfile,
  updateCareerProfile,
  getProfileCompletion,
  addProject,
  updateProject,
  deleteProject,
} from '../controllers/careerProfile.controller.js';
import {
  createResume,
  listMyResumes,
  getResumeById,
  updateResume,
  deleteResume,
  downloadResumePdf,
} from '../controllers/resume.controller.js';
import { CareerReadinessController } from '../controllers/careerReadiness.controller.js';
import { AssessmentController } from '../controllers/assessment.controller.js';
import { extractVoiceProfile } from '../controllers/voiceProfile.controller.js';

const router = Router();

// Career Profile & Transparent Completion
router.get('/career-profile', getCareerProfile);
router.patch('/career-profile', updateCareerProfile);
router.get('/profile-completion', getProfileCompletion);
router.post('/voice-profile/extract', extractVoiceProfile);

// Project Portfolio CRUD
router.post('/projects', addProject);
router.patch('/projects/:projectId', updateProject);
router.delete('/projects/:projectId', deleteProject);

// Resume Builder & Versions
router.post('/resumes', createResume);
router.get('/resumes', listMyResumes);
router.get('/resumes/:resumeId', getResumeById);
router.patch('/resumes/:resumeId', updateResume);
router.delete('/resumes/:resumeId', deleteResume);
router.get('/resumes/:resumeId/download', downloadResumePdf);

// Phase 6: Career Readiness, Skill Gaps, Smart Opportunities & Assessment History
router.get('/career-readiness', CareerReadinessController.getCareerReadiness);
router.get('/skill-gaps', CareerReadinessController.getSkillGaps);
router.get('/recommended-opportunities', CareerReadinessController.getRecommendedOpportunities);
router.get('/assessment-history', AssessmentController.getMyAssessmentHistory);

export const studentCareerRoutes = router;
