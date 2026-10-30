import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import {
  createRoadmap,
  listRoadmaps,
  getRoadmapById,
  updateRoadmapMilestone,
  updateRoadmapStatus,
  deleteRoadmap,
} from '../controllers/learningRoadmap.controller.js';

const router = Router();

router.post('/', authenticate, authorizeRole('STUDENT'), createRoadmap);
router.get('/', authenticate, authorizeRole('STUDENT'), listRoadmaps);
router.get('/:id', authenticate, authorizeRole('STUDENT'), getRoadmapById);
router.patch('/:id/milestones', authenticate, authorizeRole('STUDENT'), updateRoadmapMilestone);
router.patch('/:id/status', authenticate, authorizeRole('STUDENT'), updateRoadmapStatus);
router.delete('/:id', authenticate, authorizeRole('STUDENT'), deleteRoadmap);

export default router;
