import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeNotificationStream,
} from '../controllers/notification.controller.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.get('/stream', authenticate, subscribeNotificationStream);
router.patch('/:notificationId/read', authenticate, markAsRead);
router.post('/mark-all-read', authenticate, markAllAsRead);
router.delete('/:notificationId', authenticate, deleteNotification);

export default router;
