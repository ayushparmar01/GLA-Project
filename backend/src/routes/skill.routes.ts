import { Router } from 'express';
import { SkillController } from '../controllers/skill.controller.js';

const router = Router();

router.get('/categories', SkillController.getCategories);
router.get('/', SkillController.getSkills);

export default router;
