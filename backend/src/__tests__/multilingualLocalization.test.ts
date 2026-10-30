import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { User } from '../models/user.model.js';
import { AiService } from '../services/ai/ai.service.js';
import { WhatsAppConversationService } from '../services/whatsapp/whatsappConversation.service.js';
import { WhatsAppService } from '../services/whatsapp/whatsapp.service.js';
import { WhatsAppAccount } from '../models/whatsAppAccount.model.js';
import { generateAccessToken } from '../utils/auth.js';
import * as dbConfig from '../config/db.js';

// Mock DB connection
vi.mock('../config/db.js', () => ({
  connectDatabase: vi.fn(),
  disconnectDatabase: vi.fn(),
  getDbStatus: vi.fn().mockReturnValue({ status: 'connected' }),
}));

describe('Phase 11 — Multilingual Localization & Language Accessibility Tests', () => {
  const studentUser = {
    _id: '507f191e810c19729de860ea',
    id: '507f191e810c19729de860ea',
    fullName: 'Pooja Sharma',
    email: 'pooja@ruralpolytechnic.edu.in',
    role: 'STUDENT',
    preferredLanguage: 'en',
    isActive: true,
    studentProfile: {
      collegeName: 'District Polytechnic Mandya',
      course: 'Diploma in Computer Science',
      graduationYear: 2026,
      skills: ['Python', 'SQL'],
    },
    save: vi.fn().mockResolvedValue(true),
    toSafeObject: function () {
      return {
        id: this.id,
        fullName: this.fullName,
        email: this.email,
        role: this.role,
        preferredLanguage: this.preferredLanguage,
        isActive: this.isActive,
        studentProfile: this.studentProfile,
      };
    },
  };

  const studentToken = generateAccessToken({
    userId: studentUser.id,
    email: studentUser.email,
    role: 'STUDENT',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(dbConfig, 'getDbStatus').mockReturnValue({ status: 'connected' } as any);
  });

  describe('User Language Preference APIs', () => {
    it('returns 401 when unauthenticated user attempts to update language', async () => {
      const res = await request(app)
        .patch('/api/users/preferences/language')
        .send({ preferredLanguage: 'hi' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('successfully updates user language preference to Hindi (hi)', async () => {
      const mockDoc = { ...studentUser, preferredLanguage: 'en', save: vi.fn().mockResolvedValue(true) };
      vi.spyOn(User, 'findById').mockResolvedValueOnce(mockDoc as any);

      const res = await request(app)
        .patch('/api/users/preferences/language')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ preferredLanguage: 'hi' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.preferredLanguage).toBe('hi');
      expect(mockDoc.preferredLanguage).toBe('hi');
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('successfully updates user language preference to Hinglish (hi-Latn)', async () => {
      const mockDoc = { ...studentUser, preferredLanguage: 'en', save: vi.fn().mockResolvedValue(true) };
      vi.spyOn(User, 'findById').mockResolvedValueOnce(mockDoc as any);

      const res = await request(app)
        .patch('/api/users/preferences/language')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ preferredLanguage: 'hi-Latn' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.preferredLanguage).toBe('hi-Latn');
      expect(mockDoc.preferredLanguage).toBe('hi-Latn');
    });

    it('rejects invalid or unsupported language codes with 400', async () => {
      const res = await request(app)
        .patch('/api/users/preferences/language')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ preferredLanguage: 'fr' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_LANGUAGE_CODE');
      expect(res.body.error.message).toContain('en, hi, hi-Latn');
    });

    it('rejects empty or missing language payload with 400', async () => {
      const res = await request(app)
        .patch('/api/users/preferences/language')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_LANGUAGE_CODE');
    });

    it('allows updating preferredLanguage via standard PATCH /api/users/me', async () => {
      const mockDoc = {
        ...studentUser,
        preferredLanguage: 'en',
        save: vi.fn().mockResolvedValue(true),
        toSafeObject: () => ({ ...studentUser, preferredLanguage: 'hi' }),
      };
      vi.spyOn(User, 'findById').mockResolvedValueOnce(mockDoc as any);

      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ preferredLanguage: 'hi' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDoc.preferredLanguage).toBe('hi');
    });
  });

  describe('Multilingual AI Career Assistant Behavior', () => {
    it('returns localized Hindi guidance from deterministic fallback provider', async () => {
      const aiService = AiService.getInstance();
      const response = await aiService.generateGuidance(
        studentUser.id,
        'How should I prepare for interview and DSA?',
        {
          language: 'hi',
          studentContext: {
            targetRole: 'Software Engineer',
            verifiedSkills: ['Python', 'SQL'],
            course: 'Diploma CSE',
            language: 'hi',
          },
        }
      );

      expect(response.isFallback).toBe(true);
      expect(response.content).toContain('[निश्चित कैरियर मार्गदर्शन]');
      expect(response.content).toContain('साक्षात्कारों के लिए प्रमुख तैयारी स्तंभ');
      expect(response.content).toContain('डेटा स्ट्रक्चर्स और एल्गोरिदम (DSA)');
    });

    it('returns localized Hinglish guidance when language is hi-Latn', async () => {
      const aiService = AiService.getInstance();
      const response = await aiService.generateGuidance(
        studentUser.id,
        'How should I prepare for interview?',
        {
          language: 'hi-Latn',
          studentContext: {
            targetRole: 'Software Engineer',
            verifiedSkills: ['Python'],
            course: 'Diploma CSE',
            language: 'hi-Latn',
          },
        }
      );

      expect(response.isFallback).toBe(true);
      expect(response.content).toContain('[Deterministic Career Guidance]');
      expect(response.content).toContain('interview preparation ke main pillars');
      expect(response.content).toContain('NeetCode 150');
    });

    it('returns standard English guidance when language is en or default', async () => {
      const aiService = AiService.getInstance();
      const response = await aiService.generateGuidance(
        studentUser.id,
        'How should I prepare for interview?',
        {
          language: 'en',
          studentContext: {
            targetRole: 'Software Engineer',
            verifiedSkills: ['Python'],
            course: 'Diploma CSE',
          },
        }
      );

      expect(response.isFallback).toBe(true);
      expect(response.content).toContain('[Deterministic Career Guidance]');
      expect(response.content).toContain('Key preparation pillars for Software Engineer interviews');
    });
  });

  describe('Multilingual WhatsApp Conversational Templates', () => {
    it('renders Hindi conversational menu when student preference is hi', async () => {
      const waService = WhatsAppService.getInstance();
      const sendInteractiveSpy = vi
        .spyOn(waService, 'sendInteractiveButtons')
        .mockResolvedValueOnce({ success: true, messageId: 'msg-hi-101' });

      await WhatsAppConversationService.sendWelcomeMenu('919876543210', 'hi');

      expect(sendInteractiveSpy).toHaveBeenCalledWith(
        '919876543210',
        expect.stringContaining('CareerBridge में आपका स्वागत है'),
        expect.arrayContaining([
          expect.objectContaining({ title: 'नौकरियां खोजें' }),
          expect.objectContaining({ title: 'मेरे आवेदन' }),
          expect.objectContaining({ title: 'AI मार्गदर्शन' }),
        ])
      );
    });

    it('renders Hinglish conversational menu when student preference is hi-Latn', async () => {
      const waService = WhatsAppService.getInstance();
      const sendInteractiveSpy = vi
        .spyOn(waService, 'sendInteractiveButtons')
        .mockResolvedValueOnce({ success: true, messageId: 'msg-hilatn-102' });

      await WhatsAppConversationService.sendWelcomeMenu('919876543210', 'hi-Latn');

      expect(sendInteractiveSpy).toHaveBeenCalledWith(
        '919876543210',
        expect.stringContaining('CareerBridge me aapka swagat hai'),
        expect.arrayContaining([
          expect.objectContaining({ title: 'Jobs Khojein' }),
        ])
      );
    });

    it('renders English conversational menu as standard baseline', async () => {
      const waService = WhatsAppService.getInstance();
      const sendInteractiveSpy = vi
        .spyOn(waService, 'sendInteractiveButtons')
        .mockResolvedValueOnce({ success: true, messageId: 'msg-en-103' });

      await WhatsAppConversationService.sendWelcomeMenu('919876543210', 'en');

      expect(sendInteractiveSpy).toHaveBeenCalledWith(
        '919876543210',
        expect.stringContaining('Welcome to CareerBridge'),
        expect.arrayContaining([
          expect.objectContaining({ title: 'Find Jobs' }),
        ])
      );
    });
  });
});
