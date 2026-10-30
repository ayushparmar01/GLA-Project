import { Router } from 'express';
import { listResources } from '../controllers/learningResource.controller.js';

const router = Router();

// Learning resources are publicly browsable or student-accessible
router.get('/', listResources);

export default router;
