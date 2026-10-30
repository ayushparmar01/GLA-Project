import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  createAnnouncement,
  listAnnouncements,
  getAnnouncementById,
} from '../controllers/announcement.controller.js';

const router = Router();

router.post('/', authenticate, createAnnouncement);
router.get('/', authenticate, listAnnouncements);
router.get('/:id', authenticate, getAnnouncementById);

export default router;
