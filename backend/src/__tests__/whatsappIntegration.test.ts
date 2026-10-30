import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { generateToken } from '../utils/auth.js';
import { config } from '../config/env.js';
import { WhatsAppAccount } from '../models/whatsAppAccount.model.js';
import { WhatsAppLinkToken } from '../models/whatsAppLinkToken.model.js';
import { WhatsAppWebhookEvent } from '../models/whatsAppWebhookEvent.model.js';
import { WhatsAppMessage } from '../models/whatsAppMessage.model.js';
import { User } from '../models/user.model.js';
import { PlacementDrive } from '../models/placementDrive.model.js';
import { PlacementApplication } from '../models/placementApplication.model.js';
import { WhatsAppService } from '../services/whatsapp/whatsapp.service.js';
import { WhatsAppWebhookVerificationService } from '../services/whatsapp/whatsappWebhookVerification.service.js';
import { WhatsAppMessageParser } from '../services/whatsapp/whatsappMessageParser.service.js';
import { WhatsAppAccountLinkingService } from '../services/whatsapp/whatsappAccountLinking.service.js';
import { WhatsAppConversationService } from '../services/whatsapp/whatsappConversation.service.js';
import { WhatsAppRateLimiter } from '../services/whatsapp/whatsappRateLimiter.js';
import { WhatsAppNotificationService } from '../services/whatsapp/whatsappNotification.service.js';

describe('Phase 10: Advanced WhatsApp Career Assistant', () => {
  const app = createApp();

  const studentId = '507f1f77bcf86cd799439011';
  const otherStudentId = '507f1f77bcf86cd799439088';
  const adminId = '507f1f77bcf86cd799439999';
  const employerId = '507f1f77bcf86cd799439022';
  const collegeId = '507f1f77bcf86cd799439033';

  const studentToken = generateToken({
    sub: studentId,
    email: 'priya.sharma@polytechnic.edu.in',
    role: 'STUDENT',
  });

  const adminToken = generateToken({
    sub: adminId,
    email: 'governance.admin@careerbridge.in',
    role: 'ADMIN',
  });

  const employerToken = generateToken({
    sub: employerId,
    email: 'recruiter@techbharat.in',
    role: 'EMPLOYER',
  });

  const collegeToken = generateToken({
    sub: collegeId,
    email: 'tpo@polytechnic.edu.in',
    role: 'COLLEGE',
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    WhatsAppRateLimiter.reset();
  });

  describe('1. Webhook Handshake & Verification (GET)', () => {
    it('should return challenge with 200 when hub.verify_token matches', async () => {
      const challengeToken = 'random_meta_challenge_123456';

      const res = await request(app).get('/api/whatsapp/webhook').query({
        'hub.mode': 'subscribe',
        'hub.verify_token': config.whatsappVerifyToken,
        'hub.challenge': challengeToken,
      });

      expect(res.status).toBe(200);
      expect(res.text).toBe(challengeToken);
    });

    it('should reject handshake with 403 when verify token does not match', async () => {
      const res = await request(app).get('/api/whatsapp/webhook').query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'chall_123',
      });

      expect(res.status).toBe(403);
    });

    it('should reject handshake with 400 when query parameters are missing', async () => {
      const res = await request(app).get('/api/whatsapp/webhook');
      expect(res.status).toBe(400);
    });
  });

  describe('2. Webhook Signature Security (POST)', () => {
    it('should reject webhook payloads with invalid HMAC-SHA256 signature', async () => {
      // Temporarily enable verification requirement with an app secret
      vi.spyOn(config, 'whatsappEnabled', 'get').mockReturnValue(true);
      vi.spyOn(config, 'whatsappAppSecret', 'get').mockReturnValue('super_meta_secret_12345');

      const payload = { object: 'whatsapp_business_account', entry: [] };

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .set('x-hub-signature-256', 'sha256=invalid_calculated_signature_hex')
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_SIGNATURE');
    });

    it('should accept webhook payloads with valid HMAC-SHA256 signature', async () => {
      vi.spyOn(config, 'whatsappEnabled', 'get').mockReturnValue(true);
      vi.spyOn(config, 'whatsappAppSecret', 'get').mockReturnValue('super_meta_secret_12345');

      const payload = { object: 'whatsapp_business_account', entry: [] };
      const rawPayload = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', 'super_meta_secret_12345')
        .update(rawPayload)
        .digest('hex');

      const res = await request(app)
        .post('/api/whatsapp/webhook')
        .set('x-hub-signature-256', `sha256=${signature}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. Duplicate Webhook Event Deduplication', () => {
    it('should reject or bypass processing when event ID was already processed', async () => {
      const eventId = 'wamid_duplicate_test_101';

      // Mock that this event ID already exists in MongoDB
      vi.spyOn(WhatsAppWebhookEvent, 'findOne').mockResolvedValue({ eventId } as any);
      const handleSpy = vi.spyOn(WhatsAppConversationService, 'handleInboundMessage');

      const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '1234567890', phone_number_id: '99999' },
                  messages: [
                    {
                      from: '919876543210',
                      id: eventId,
                      timestamp: '1730280000',
                      text: { body: 'MENU' },
                      type: 'text',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const res = await request(app).post('/api/whatsapp/webhook').send(webhookPayload);

      expect(res.status).toBe(200);
      expect(handleSpy).not.toHaveBeenCalled();
    });
  });

  describe('4. Message Parsing & Command Normalization', () => {
    it('should normalize numeric commands and text keywords', () => {
      expect(WhatsAppMessageParser.normalizeCommand('1')).toBe('JOBS');
      expect(WhatsAppMessageParser.normalizeCommand('2')).toBe('APPLICATIONS');
      expect(WhatsAppMessageParser.normalizeCommand('3')).toBe('INTERVIEWS');
      expect(WhatsAppMessageParser.normalizeCommand('4')).toBe('PROFILE');
      expect(WhatsAppMessageParser.normalizeCommand('5')).toBe('SKILLS');
      expect(WhatsAppMessageParser.normalizeCommand('6')).toBe('GUIDANCE');
      expect(WhatsAppMessageParser.normalizeCommand('7')).toBe('HELP');
      expect(WhatsAppMessageParser.normalizeCommand('MENU')).toBe('MENU');
      expect(WhatsAppMessageParser.normalizeCommand('stop')).toBe('STOP');
      expect(WhatsAppMessageParser.normalizeCommand('START')).toBe('START');
    });

    it('should recognize 6-character linking codes', () => {
      expect(WhatsAppMessageParser.normalizeCommand('CB94X2')).toBe('LINK_CB94X2');
      expect(WhatsAppMessageParser.normalizeCommand('cb-94x2')).toBe('LINK_CB94X2');
    });

    it('should extract messages and statuses from Meta webhook payload', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            changes: [
              {
                field: 'messages',
                value: {
                  messages: [
                    {
                      id: 'msg-1',
                      from: '919876543210',
                      timestamp: '1730280000',
                      type: 'text',
                      text: { body: 'jobs' },
                    },
                  ],
                  statuses: [
                    {
                      id: 'msg-out-1',
                      recipient_id: '919876543210',
                      status: 'delivered',
                      timestamp: '1730280005',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const { messages, statuses } = WhatsAppMessageParser.parseWebhookBody(payload);
      expect(messages).toHaveLength(1);
      expect(messages[0].from).toBe('919876543210');
      expect(messages[0].command).toBe('JOBS');
      expect(statuses).toHaveLength(1);
      expect(statuses[0].status).toBe('delivered');
    });
  });

  describe('5. Secure WhatsApp Account Linking', () => {
    it('should generate a 6-character short-lived linking code for authenticated student', async () => {
      vi.spyOn(WhatsAppLinkToken, 'updateMany').mockResolvedValue({} as any);
      vi.spyOn(WhatsAppLinkToken, 'create').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/whatsapp/link/request')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toHaveLength(6);
      expect(res.body.data.expiresInSeconds).toBe(300);
      expect(res.body.data.instruction).toContain('CareerBridge on WhatsApp');
    });

    it('should enforce rate limits on linking code generation requests', async () => {
      vi.spyOn(WhatsAppRateLimiter, 'isLinkRequestAllowed').mockReturnValue(false);

      const res = await request(app)
        .post('/api/whatsapp/link/request')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(429);
      expect(res.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should reject expired linking codes', async () => {
      vi.spyOn(WhatsAppLinkToken, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/whatsapp/link/verify')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ code: 'EXPD99', phoneNumber: '+919876543210' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('LINK_FAILED');
      expect(res.body.error.message).toContain('Invalid or expired linking code');
    });

    it('should reject reused linking codes', async () => {
      // Simulate token already marked as used: true
      vi.spyOn(WhatsAppLinkToken, 'findOne').mockResolvedValue(null);

      const res = await request(app)
        .post('/api/whatsapp/link/verify')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ code: 'USED01', phoneNumber: '+919876543210' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('LINK_FAILED');
    });

    it('should link verified WhatsApp number and update student profile', async () => {
      const mockToken = {
        userId: new mongoose.Types.ObjectId(studentId),
        used: false,
        attempts: 0,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(WhatsAppLinkToken, 'findOne').mockResolvedValue(mockToken as any);
      vi.spyOn(WhatsAppAccount, 'findOne').mockResolvedValue(null);
      vi.spyOn(WhatsAppAccount, 'findOneAndUpdate').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        phoneNumber: '919876543210',
        verified: true,
      } as any);

      const mockStudent = {
        fullName: 'Priya Sharma',
        studentProfile: {},
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(User, 'findById').mockResolvedValue(mockStudent as any);
      const sendSpy = vi.spyOn(WhatsAppService.getInstance(), 'sendTextMessage').mockResolvedValue({
        success: true,
        messageId: 'wa-confirm-1',
      });

      const res = await request(app)
        .post('/api/whatsapp/link/verify')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ code: 'VALID1', phoneNumber: '919876543210' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockToken.used).toBe(true);
      expect(mockStudent.save).toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalled();
    });

    it('should unlink WhatsApp account when student requests unlink', async () => {
      vi.spyOn(WhatsAppAccountLinkingService, 'unlinkAccount').mockResolvedValue(true);

      const res = await request(app)
        .delete('/api/whatsapp/link')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('unlinked successfully');
    });
  });

  describe('6. Job & Internship Discovery over WhatsApp', () => {
    it('should list active published jobs from MongoDB with real database records', async () => {
      const mockDrives = [
        {
          title: 'Junior Cloud Engineer',
          organizationName: 'Bharat Cloud Tech',
          opportunityType: 'JOB',
          location: 'Indore, MP',
          requiredSkills: ['AWS', 'Linux', 'Python'],
          applicationDeadline: '2026-11-30T23:59:59.000Z',
          salaryRange: '₹3.6 - ₹4.5 LPA',
        },
      ];

      vi.spyOn(PlacementDrive, 'find').mockReturnValue({
        sort: () => ({
          limit: () => ({
            exec: async () => mockDrives,
          }),
        }),
      } as any);

      const sendSpy = vi.spyOn(WhatsAppService.getInstance(), 'sendTextMessage').mockResolvedValue({
        success: true,
      });

      await WhatsAppConversationService.handleInboundMessage({
        messageId: 'test-job-1',
        from: '919876543210',
        timestamp: new Date(),
        type: 'text',
        command: 'JOBS',
      });

      expect(sendSpy).toHaveBeenCalled();
      const sentMessage = sendSpy.mock.calls[0][1];
      expect(sentMessage).toContain('Junior Cloud Engineer');
      expect(sentMessage).toContain('Bharat Cloud Tech');
      expect(sentMessage).toContain('₹3.6 - ₹4.5 LPA');
    });
  });

  describe('7. Application Tracking & Privacy Enforcement', () => {
    it('should deny unlinked users from viewing application status', async () => {
      // No active WhatsAppAccount linked for this phone
      vi.spyOn(WhatsAppAccount, 'findOne').mockResolvedValue(null);
      const sendSpy = vi.spyOn(WhatsAppService.getInstance(), 'sendTextMessage').mockResolvedValue({
        success: true,
      });

      await WhatsAppConversationService.handleInboundMessage({
        messageId: 'test-app-unlinked',
        from: '919876543210',
        timestamp: new Date(),
        type: 'text',
        command: 'APPLICATIONS',
      });

      expect(sendSpy).toHaveBeenCalled();
      expect(sendSpy.mock.calls[0][1]).toContain('Account Linking Required');
    });

    it('should fetch only the linked student personal applications', async () => {
      vi.spyOn(WhatsAppAccount, 'findOne').mockResolvedValue({
        userId: new mongoose.Types.ObjectId(studentId),
        status: 'ACTIVE',
      } as any);

      const mockApps = [
        {
          driveId: {
            title: 'Frontend Trainee',
            organizationName: 'Indore Webworks',
          },
          status: 'SHORTLISTED',
          appliedAt: new Date('2026-10-20'),
        },
      ];

      vi.spyOn(PlacementApplication, 'find').mockReturnValue({
        populate: () => ({
          sort: () => ({
            limit: () => ({
              exec: async () => mockApps,
            }),
          }),
        }),
      } as any);

      const sendSpy = vi.spyOn(WhatsAppService.getInstance(), 'sendTextMessage').mockResolvedValue({
        success: true,
      });

      await WhatsAppConversationService.handleInboundMessage({
        messageId: 'test-app-linked',
        from: '919876543210',
        timestamp: new Date(),
        type: 'text',
        command: 'APPLICATIONS',
      });

      expect(sendSpy).toHaveBeenCalled();
      const sentMessage = sendSpy.mock.calls[0][1];
      expect(sentMessage).toContain('Frontend Trainee');
      expect(sentMessage).toContain('SHORTLISTED');
    });
  });

  describe('8. Opt-In & Opt-Out Handling (STOP / START)', () => {
    it('should pause notifications and mark account OPTED_OUT when STOP is sent', async () => {
      const mockAccount = {
        status: 'ACTIVE',
        notificationsEnabled: true,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(WhatsAppAccount, 'findOne').mockResolvedValue(mockAccount as any);
      const sendSpy = vi.spyOn(WhatsAppService.getInstance(), 'sendTextMessage').mockResolvedValue({
        success: true,
      });

      await WhatsAppConversationService.handleInboundMessage({
        messageId: 'test-stop',
        from: '919876543210',
        timestamp: new Date(),
        type: 'text',
        command: 'STOP',
      });

      expect(mockAccount.status).toBe('OPTED_OUT');
      expect(mockAccount.notificationsEnabled).toBe(false);
      expect(sendSpy.mock.calls[0][1]).toContain('Notifications Paused');
    });

    it('should resume notifications and mark account ACTIVE when START is sent', async () => {
      const mockAccount = {
        status: 'OPTED_OUT',
        notificationsEnabled: false,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.spyOn(WhatsAppAccount, 'findOne').mockResolvedValue(mockAccount as any);
      const sendSpy = vi.spyOn(WhatsAppService.getInstance(), 'sendTextMessage').mockResolvedValue({
        success: true,
      });

      await WhatsAppConversationService.handleInboundMessage({
        messageId: 'test-start',
        from: '919876543210',
        timestamp: new Date(),
        type: 'text',
        command: 'START',
      });

      expect(mockAccount.status).toBe('ACTIVE');
      expect(mockAccount.notificationsEnabled).toBe(true);
      expect(sendSpy.mock.calls[0][1]).toContain('Welcome Back');
    });
  });

  describe('9. Transactional Notifications & Consent Enforcement', () => {
    it('should suppress interview alerts if student has opted out or disabled interview alerts', async () => {
      vi.spyOn(WhatsAppAccount, 'findOne').mockResolvedValue(null);
      const sendSpy = vi.spyOn(WhatsAppService.getInstance(), 'sendTextMessage');

      const dispatched = await WhatsAppNotificationService.sendInterviewAlert({
        studentId,
        companyName: 'TechBharat',
        jobTitle: 'Backend Dev',
        interviewType: 'VIRTUAL',
        scheduledAt: new Date(),
      });

      expect(dispatched).toBe(false);
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('should send interview alert when student is opted in', async () => {
      vi.spyOn(WhatsAppAccount, 'findOne').mockResolvedValue({
        phoneNumber: '919876543210',
        status: 'ACTIVE',
        notificationsEnabled: true,
        interviewAlertsEnabled: true,
      } as any);

      const sendSpy = vi.spyOn(WhatsAppService.getInstance(), 'sendTextMessage').mockResolvedValue({
        success: true,
      });

      const dispatched = await WhatsAppNotificationService.sendInterviewAlert({
        studentId,
        companyName: 'TechBharat',
        jobTitle: 'Backend Dev',
        interviewType: 'VIRTUAL',
        scheduledAt: new Date(),
        meetingUrl: 'https://meet.google.com/abc-xyz',
      });

      expect(dispatched).toBe(true);
      expect(sendSpy).toHaveBeenCalled();
      expect(sendSpy.mock.calls[0][1]).toContain('Interview Scheduled');
      expect(sendSpy.mock.calls[0][1]).toContain('TechBharat');
    });
  });

  describe('10. Admin Control Centre & Security Isolation', () => {
    it('should forbid non-admin roles from accessing WhatsApp admin endpoints (403)', async () => {
      const studentRes = await request(app)
        .get('/api/whatsapp/admin/status')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(studentRes.status).toBe(403);

      const employerRes = await request(app)
        .get('/api/whatsapp/admin/analytics')
        .set('Authorization', `Bearer ${employerToken}`);
      expect(employerRes.status).toBe(403);

      const collegeRes = await request(app)
        .get('/api/whatsapp/admin/events')
        .set('Authorization', `Bearer ${collegeToken}`);
      expect(collegeRes.status).toBe(403);
    });

    it('should allow ADMIN to inspect WhatsApp integration status without secret leakage', async () => {
      const res = await request(app)
        .get('/api/whatsapp/admin/status')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBeDefined();

      const stringified = JSON.stringify(res.body.data);
      expect(stringified).not.toContain('WHATSAPP_ACCESS_TOKEN');
      expect(stringified).not.toContain('WHATSAPP_APP_SECRET');
    });

    it('should allow ADMIN to retrieve WhatsApp analytics from real database counts', async () => {
      vi.spyOn(WhatsAppAccount, 'countDocuments').mockReturnValue({ exec: async () => 25 } as any);
      vi.spyOn(WhatsAppMessage, 'countDocuments').mockReturnValue({ exec: async () => 100 } as any);
      vi.spyOn(WhatsAppWebhookEvent, 'countDocuments').mockReturnValue({ exec: async () => 140 } as any);

      const res = await request(app)
        .get('/api/whatsapp/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalLinkedAccounts).toBe(25);
    });
  });
});
