import { Router } from 'express';
import { getMe } from '../controllers/auth.controller.js';
import { updateMe, updateLanguagePreference } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);
router.patch('/preferences/language', authenticate, updateLanguagePreference);

export default router;
