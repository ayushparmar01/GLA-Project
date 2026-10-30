import { Router } from 'express';
import { authenticate, authorizeRole } from '../middlewares/auth.js';
import {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  registerForEvent,
  cancelRegistration,
  getEventRegistrations,
} from '../controllers/careerEvent.controller.js';

const router = Router();

router.post('/', authenticate, createEvent);
router.get('/', listEvents);
router.get('/:eventId', getEventById);
router.patch('/:eventId', authenticate, updateEvent);
router.post('/:eventId/register', authenticate, authorizeRole('STUDENT'), registerForEvent);
router.delete('/:eventId/register', authenticate, authorizeRole('STUDENT'), cancelRegistration);
router.get('/:eventId/registrations', authenticate, getEventRegistrations);

export default router;
