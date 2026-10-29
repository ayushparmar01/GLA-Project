import { Router } from 'express';
import { getCollegeStats } from '../controllers/collegeStats.controller.js';
import { authenticate, authorizeRole } from '../middlewares/auth.js';

const router = Router();

// College dashboard KPIs & aggregate statistics
router.get('/stats', authenticate, authorizeRole('COLLEGE'), getCollegeStats);

export default router;
