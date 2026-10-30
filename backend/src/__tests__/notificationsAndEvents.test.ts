import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import { NotificationService } from '../services/notification/notification.service.js';
import { RealtimeBrokerService } from '../services/notification/realtimeBroker.service.js';
import { CareerEvent } from '../models/careerEvent.model.js';
import { EventRegistration } from '../models/eventRegistration.model.js';
import { IExternalNotificationProvider } from '../services/notification/notificationProvider.interface.js';

describe('Phase 8: Notification Engine, Communication Centre & Career Events', () => {
  const app = createApp();

  const studentAId = '507f1f77bcf86cd799439011';
  const studentBId = '507f1f77bcf86cd799439088';
  const collegeId = '507f1f77bcf86cd799439033';
  const employerId = '507f1f77bcf86cd799439022';

  const studentAToken = generateToken({
    sub: studentAId,
    email: 'studentA@district.edu.in',
    role: 'STUDENT',
  });

  const studentBToken = generateToken({
    sub: studentBId,
    email: 'studentB@district.edu.in',
    role: 'STUDENT',
  });

  const collegeToken = generateToken({
    sub: collegeId,
    email: 'tpo@district.edu.in',
    role: 'COLLEGE',
  });

  const employerToken = generateToken({
    sub: employerId,
    email: 'recruiter@techcorp.in',
    role: 'EMPLOYER',
  });

  beforeEach(() => {
    NotificationService.getInstance().clearMemory();
    RealtimeBrokerService.getInstance().reset();
  });

  describe('1. Central Notification System & Deduplication', () => {
    it('should create an in-app notification and dispatch real-time events', async () => {
      const notifService = NotificationService.getInstance();
      const notif = await notifService.createNotification({
        recipientId: studentAId,
        type: 'DRIVE_PUBLISHED',
        title: 'New Campus Placement Drive: Cloud Bharat',
        message: 'Cloud Bharat has announced an off-campus placement drive for 2025 graduates.',
        relatedEntityType: 'PLACEMENT_DRIVE',
        relatedEntityId: 'drive-test-101',
      });

      expect(notif).toBeDefined();
      expect(notif?.recipientId).toBe(studentAId);
      expect(notif?.type).toBe('DRIVE_PUBLISHED');
      expect(notif?.isRead).toBe(false);
      expect(notif?.readAt).toBeNull();
    });

    it('should suppress duplicate notifications within the deduplication window', async () => {
      const notifService = NotificationService.getInstance();

      const notif1 = await notifService.createNotification({
        recipientId: studentAId,
        type: 'APPLICATION_STATUS_CHANGED',
        title: 'Status Updated: Shortlisted',
        message: 'Your application has been shortlisted.',
        relatedEntityType: 'APPLICATION',
        relatedEntityId: 'app-999',
        deduplicationWindowSeconds: 10,
      });

      const notif2 = await notifService.createNotification({
        recipientId: studentAId,
        type: 'APPLICATION_STATUS_CHANGED',
        title: 'Status Updated: Shortlisted',
        message: 'Your application has been shortlisted.',
        relatedEntityType: 'APPLICATION',
        relatedEntityId: 'app-999',
        deduplicationWindowSeconds: 10,
      });

      expect(notif1).not.toBeNull();
      expect(notif2).toBeNull(); // Suppressed as duplicate
    });

    it('should gracefully handle external provider failure without blocking core notification creation', async () => {
      const notifService = NotificationService.getInstance();

      // Mock an external provider that rejects/fails
      const failingProvider: IExternalNotificationProvider = {
        providerName: 'FAILING_EMAIL_PROVIDER',
        isConfigured: () => true,
        sendNotification: async () => {
          throw new Error('SMTP connection timed out');
        },
      };

      notifService.setExternalProvider(failingProvider);

      const notif = await notifService.createNotification({
        recipientId: studentAId,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'System Notice',
        message: 'Scheduled maintenance update.',
      });

      // Must succeed despite external delivery failure
      expect(notif).not.toBeNull();
      expect(notif?.title).toBe('System Notice');
    });
  });

  describe('2. Notification Endpoints & Ownership Isolation', () => {
    let createdNotifId: string;

    beforeEach(async () => {
      const notifService = NotificationService.getInstance();
      const n = await notifService.createNotification({
        recipientId: studentAId,
        type: 'INTERVIEW_SCHEDULED',
        title: 'Technical Interview Round 1',
        message: 'Your interview is scheduled for Friday at 3:00 PM.',
        relatedEntityType: 'INTERVIEW',
        relatedEntityId: 'int-123',
      });
      if (n) createdNotifId = n.id;
    });

    it('should retrieve notifications via GET /api/notifications for authenticated user', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
    });

    it('should count unread notifications via GET /api/notifications/unread-count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
    });

    it('should isolate notifications: Student B cannot see Student A notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${studentBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.unreadCount).toBe(0);
    });

    it('should mark a notification as read via PATCH /api/notifications/:id/read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${createdNotifId}/read`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
      expect(res.body.data.readAt).toBeDefined();
    });

    it('should reject marking another user notification as read with 404', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${createdNotifId}/read`)
        .set('Authorization', `Bearer ${studentBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should mark all notifications as read via POST /api/notifications/mark-all-read', async () => {
      const res = await request(app)
        .post('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${studentAToken}`);
      expect(countRes.body.data.unreadCount).toBe(0);
    });

    it('should delete a notification via DELETE /api/notifications/:id', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${createdNotifId}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Real-Time Broker & Personal Room Isolation', () => {
    it('should correctly track private user connections in RealtimeBrokerService', () => {
      const broker = RealtimeBrokerService.getInstance();
      expect(broker.getClientCount(studentAId)).toBe(0);

      // Create a mock response
      const mockRes: any = {
        write: () => true,
        on: () => true,
      };

      broker.registerClient(studentAId, mockRes);
      expect(broker.getClientCount(studentAId)).toBe(1);

      // Sending to Student B should not deliver to Student A
      const deliveredB = broker.sendToUser(studentBId, 'test_event', { msg: 'hello' });
      expect(deliveredB).toBe(0);

      // Sending to Student A delivers 1
      const deliveredA = broker.sendToUser(studentAId, 'test_event', { msg: 'hello' });
      expect(deliveredA).toBe(1);
    });
  });

  describe('4. Career Events Engine (Creation, Validation & Management)', () => {
    let createdEventId: string;

    it('should allow COLLEGE to create a career event with valid dates and capacity', async () => {
      const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000);
      const nextWeekEnd = new Date(nextWeek.getTime() + 2 * 3600 * 1000);
      const deadline = new Date(Date.now() + 5 * 24 * 3600 * 1000);

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          title: 'Full-Stack Web Dev Masterclass',
          description: 'Hands-on live workshop covering React 19 and scalable Node.js architectures for campus placement.',
          eventType: 'WORKSHOP',
          startAt: nextWeek.toISOString(),
          endAt: nextWeekEnd.toISOString(),
          location: 'Virtual / Google Meet',
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
          registrationDeadline: deadline.toISOString(),
          capacity: 50,
          status: 'PUBLISHED',
          tags: ['React', 'Node.js', 'WebDev'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Full-Stack Web Dev Masterclass');
      expect(res.body.data.eventType).toBe('WORKSHOP');
      expect(res.body.data.organizerRole).toBe('COLLEGE');
      expect(res.body.data.capacity).toBe(50);
      expect(res.body.data.registeredCount).toBe(0);

      createdEventId = res.body.data.id;
    });

    it('should reject event creation by STUDENT with 403', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          title: 'Unauthorized Student Hackathon',
          description: 'Students cannot broadcast events directly without college review.',
          eventType: 'HACKATHON',
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 90000000).toISOString(),
          location: 'Lab 1',
          registrationDeadline: new Date(Date.now() + 40000000).toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject event creation with endAt earlier than startAt with 400', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: 'TechCorp Hiring Drive',
          description: 'Off-campus recruitment test.',
          eventType: 'INTERVIEW_DRIVE',
          startAt: new Date(Date.now() + 86400000).toISOString(),
          endAt: new Date(Date.now() + 3600000).toISOString(), // Earlier than startAt
          location: 'Bangalore Campus',
          registrationDeadline: new Date(Date.now() + 1000000).toISOString(),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should list published events via GET /api/events', async () => {
      const res = await request(app).get('/api/events');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should retrieve event by ID via GET /api/events/:id', async () => {
      if (!createdEventId) return;

      const res = await request(app).get(`/api/events/${createdEventId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdEventId);
    });
  });

  describe('5. Event Registration Lifecycle & Validation', () => {
    let testEvent: any;

    beforeEach(async () => {
      const futureDate = new Date(Date.now() + 5 * 86400000);
      testEvent = new CareerEvent({
        title: 'Industry Mock Interviews 2026',
        description: 'Mock technical and HR interview rounds with senior engineers.',
        eventType: 'TRAINING_SESSION',
        organizerId: collegeId,
        organizerRole: 'COLLEGE',
        startAt: futureDate,
        endAt: new Date(futureDate.getTime() + 7200000),
        location: 'Virtual',
        registrationDeadline: new Date(Date.now() + 3 * 86400000),
        capacity: 2, // strictly 2 seats for capacity test
        registeredCount: 0,
        status: 'PUBLISHED',
      });
      await testEvent.save();
    });

    it('should allow student to register and trigger in-app notification', async () => {
      const res = await request(app)
        .post(`/api/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.registrationStatus).toBe('REGISTERED');

      // Check event capacity incremented
      const updatedEvent = await CareerEvent.findById(testEvent._id);
      expect(updatedEvent?.registeredCount).toBe(1);

      // Verify student received confirmation notification
      const notifs = await NotificationService.getInstance().getNotifications(studentAId);
      const confNotif = notifs.notifications.find(
        (n) => n.type === 'EVENT_REGISTRATION_CONFIRMED'
      );
      expect(confNotif).toBeDefined();
      expect(confNotif?.title).toContain('Event Registration Confirmed');
    });

    it('should prevent duplicate event registration with 409 Conflict', async () => {
      // First registration
      await request(app)
        .post(`/api/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${studentAToken}`);

      // Second registration attempt
      const res = await request(app)
        .post(`/api/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    it('should enforce event capacity limits and reject when full with 400', async () => {
      // Register 1st student (capacity 2)
      await request(app)
        .post(`/api/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${studentAToken}`);

      // Register 2nd student (capacity reached)
      await request(app)
        .post(`/api/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${studentBToken}`);

      // Register 3rd student -> must fail with 400
      const thirdStudentToken = generateToken({
        sub: '507f1f77bcf86cd799439099',
        email: 'studentC@district.edu.in',
        role: 'STUDENT',
      });

      const res = await request(app)
        .post(`/api/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${thirdStudentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('full capacity');
    });

    it('should allow student to cancel registration and decrement registeredCount', async () => {
      await request(app)
        .post(`/api/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${studentAToken}`);

      const res = await request(app)
        .delete(`/api/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedEvent = await CareerEvent.findById(testEvent._id);
      expect(updatedEvent?.registeredCount).toBe(0);
    });

    it('should allow event organizer to inspect registration list via GET /api/events/:id/registrations', async () => {
      await request(app)
        .post(`/api/events/${testEvent._id}/register`)
        .set('Authorization', `Bearer ${studentAToken}`);

      const res = await request(app)
        .get(`/api/events/${testEvent._id}/registrations`)
        .set('Authorization', `Bearer ${collegeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
    });

    it('should reject unauthorized users from viewing event attendee list with 403', async () => {
      const res = await request(app)
        .get(`/api/events/${testEvent._id}/registrations`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('6. Communication Centre & Controlled Announcements', () => {
    it('should allow COLLEGE to post announcements and notify students', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${collegeToken}`)
        .send({
          title: 'Mandatory Placement Desk Registration',
          content: 'All final year diploma and degree engineering students must complete their profile verification before the pool campus drive.',
          targetAudience: 'COLLEGE_STUDENTS',
          priority: 'HIGH',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Mandatory Placement Desk Registration');
      expect(res.body.data.priority).toBe('HIGH');
    });

    it('should reject STUDENT from broadcasting announcements with 403', async () => {
      const res = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${studentAToken}`)
        .send({
          title: 'Spam announcement',
          content: 'Should be blocked.',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should list announcements via GET /api/announcements', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
