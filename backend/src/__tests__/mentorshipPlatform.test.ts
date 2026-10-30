import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { MentorMatchingService } from '../services/mentorMatching.service.js';
import { MentorshipSchedulingService } from '../services/mentorshipScheduling.service.js';
import { MentorshipAiAssistantService } from '../services/mentorshipAiAssistant.service.js';
import { MentorshipService } from '../services/mentorship.service.js';
import { MentorProfile } from '../models/mentorProfile.model.js';
import { MentorshipRequest } from '../models/mentorshipRequest.model.js';
import { MentorshipRelationship } from '../models/mentorshipRelationship.model.js';
import { MentorshipGoal } from '../models/mentorshipGoal.model.js';
import { MentorshipSession } from '../models/mentorshipSession.model.js';
import { MentorshipNote } from '../models/mentorshipNote.model.js';
import { MentorshipFeedback } from '../models/mentorshipFeedback.model.js';
import { User } from '../models/user.model.js';

describe('Phase 16 — Advanced AI-Powered Mentorship & Industry Connect Platform Tests', () => {
  const app = createApp();

  describe('1. 6-Factor Deterministic Mentor Matching Engine', () => {
    const mockMentor = {
      id: 'mentor_prof_1',
      userId: 'user_m1',
      organization: 'Google',
      designation: 'Senior Software Engineer',
      experienceYears: 6,
      industry: 'Software & IT',
      expertise: ['React', 'TypeScript', 'Node.js', 'System Design', 'Cloud Architecture'],
      mentorshipTopics: ['Mock Technical Interview', 'Resume Review', 'Career Transition'],
      bio: 'Staff engineer with 6 years experience mentoring Tier-2/3 college freshers.',
      languages: ['English', 'Hindi'],
      isAlumni: true,
      maximumMentees: 3,
      activeMenteeCount: 1,
      verificationStatus: 'VERIFIED' as const,
      availableDays: ['Saturday', 'Sunday'],
      timeSlots: [
        { day: 'Saturday', startTime: '17:00', endTime: '19:00', timezone: 'Asia/Kolkata' },
      ],
      ratingAverage: 4.9,
      totalReviews: 12,
      totalSessionsCompleted: 24,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockStudentPreferences = {
      id: 'stud_pref_1',
      studentId: 'user_s1',
      careerGoals: ['Software Engineer', 'Full-Stack Developer'],
      preferredTopics: ['Mock Technical Interview', 'Resume Review'],
      preferredIndustries: ['Software & IT'],
      preferredLanguages: ['English', 'Hindi'],
      preferredSessionTypes: ['ONE_ON_ONE' as const],
      currentMentorshipCount: 0,
      maxConcurrentMentorships: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockStudentGeneralProfile = {
      skills: ['React', 'TypeScript', 'Node.js', 'SQL'],
      technicalSkills: ['React', 'Node.js'],
      careerInterests: ['Software Engineer'],
    };

    it('should compute an explainable composite compatibility score based on the 6 weighted factors (100% total)', () => {
      const match = MentorMatchingService.calculateMatch(
        mockMentor,
        mockStudentPreferences,
        mockStudentGeneralProfile
      );

      expect(match).toBeDefined();
      expect(match.compatibilityScore).toBeGreaterThanOrEqual(85);
      expect(match.matchCategory).toBe('EXCELLENT_MATCH');

      // Verify individual factor weights
      const factors = match.factors;
      expect(factors.expertiseAlignment).toBeLessThanOrEqual(30);
      expect(factors.goalAlignment).toBeLessThanOrEqual(20);
      expect(factors.industryAlignment).toBeLessThanOrEqual(15);
      expect(factors.topicAlignment).toBeLessThanOrEqual(15);
      expect(factors.languageMatch).toBeLessThanOrEqual(10);
      expect(factors.availabilityScore).toBeLessThanOrEqual(10);

      const sum =
        factors.expertiseAlignment +
        factors.goalAlignment +
        factors.industryAlignment +
        factors.topicAlignment +
        factors.languageMatch +
        factors.availabilityScore;

      expect(match.compatibilityScore).toBe(sum);
    });

    it('should classify candidates into correct match tiers (EXCELLENT, STRONG, MODERATE, LIMITED)', () => {
      // High match
      const high = MentorMatchingService.calculateMatch(
        mockMentor,
        mockStudentPreferences,
        mockStudentGeneralProfile
      );
      expect(high.matchCategory).toBe('EXCELLENT_MATCH');

      // Low match: completely different industry, no skill overlap, full capacity
      const lowMentor = {
        ...mockMentor,
        expertise: ['Petroleum Refining', 'Geology'],
        industry: 'Oil & Gas',
        designation: 'Petroleum Geologist',
        mentorshipTopics: ['Onshore Drilling Safety'],
        languages: ['German'],
        activeMenteeCount: 3, // full
        maximumMentees: 3,
        isAlumni: false,
      };

      const low = MentorMatchingService.calculateMatch(
        lowMentor,
        mockStudentPreferences,
        mockStudentGeneralProfile
      );
      expect(low.compatibilityScore).toBeLessThan(50);
      expect(low.matchCategory).toBe('LIMITED_MATCH');
      expect(low.potentialGaps.length).toBeGreaterThan(0);
    });

    it('should provide transparent explainability reasons and highlight college alumni affiliation', () => {
      const match = MentorMatchingService.calculateMatch(
        mockMentor,
        mockStudentPreferences,
        mockStudentGeneralProfile
      );

      expect(match.positiveMatchReasons).toContain('Verified College Alumni Mentor');
      expect(match.positiveMatchReasons.some((r) => r.includes('technical skills'))).toBe(true);
      expect(match.positiveMatchReasons.some((r) => r.includes('English & Hindi'))).toBe(true);
    });
  });

  describe('2. Concurrency & Scheduling Double-Booking Engine', () => {
    it('should reject invalid chronological ranges (end before start)', async () => {
      const now = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const earlier = new Date(now.getTime() - 30 * 60 * 1000);

      const res = await MentorshipSchedulingService.validateSessionSchedule(
        'mentor_1',
        'student_1',
        now,
        earlier
      );
      expect(res.valid).toBe(false);
      expect(res.conflictReason).toContain('must be after start time');
    });

    it('should reject sessions scheduled in the past', async () => {
      const pastStart = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const pastEnd = new Date(pastStart.getTime() + 45 * 60 * 1000);

      const res = await MentorshipSchedulingService.validateSessionSchedule(
        'mentor_1',
        'student_1',
        pastStart,
        pastEnd
      );
      expect(res.valid).toBe(false);
      expect(res.conflictReason).toContain('Cannot schedule a session in the past');
    });

    it('should generate a secure, unique meeting room link', () => {
      const link1 = MentorshipSchedulingService.generateMeetingLink('rel_abc123');
      const link2 = MentorshipSchedulingService.generateMeetingLink('rel_abc123');

      expect(link1).toMatch(/^https:\/\/meet\.careerbridge\.in\/session-bc123-[a-f0-9]{8}$/);
      expect(link1).not.toBe(link2); // Unique random suffix
    });

    it('should detect conflicting overlapping sessions for the mentor', async () => {
      const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 45 * 60 * 1000);

      const spyFindOne = vi.spyOn(MentorshipSession, 'findOne').mockResolvedValueOnce({
        _id: 'existing_sess_1',
        mentorId: 'mentor_conflict',
        scheduledStart: start,
        scheduledEnd: end,
      } as any);

      const res = await MentorshipSchedulingService.validateSessionSchedule(
        'mentor_conflict',
        'student_any',
        start,
        end
      );

      expect(res.valid).toBe(false);
      expect(res.conflictReason).toContain('Mentor already has a confirmed session scheduled');
      spyFindOne.mockRestore();
    });
  });

  describe('3. AI Mentorship Assistant & Fallback Engine', () => {
    it('should generate a structured 45-minute meeting agenda with deterministic fallback', async () => {
      const agenda = await MentorshipAiAssistantService.prepareSessionAgenda(
        'System Design & Microservices',
        'Prepare for upcoming Tier-1 campus placement interview'
      );

      expect(agenda).toBeDefined();
      expect(agenda.topic).toBe('System Design & Microservices');
      expect(agenda.durationMinutes).toBe(45);
      expect(agenda.agendaItems.length).toBe(4);
      expect(agenda.agendaItems[0].timeSlot).toBe('00:00 - 00:05');
      expect(agenda.suggestedPreparation.length).toBeGreaterThan(0);
      expect(agenda.isFallback).toBe(true);
    });

    it('should suggest 5 high-impact questions to ask during a mentorship call', async () => {
      const questionsRes = await MentorshipAiAssistantService.suggestDiscussionQuestions(
        'Full-Stack Web Development',
        'Understanding production React and Node architectures',
        'Software & IT'
      );

      expect(questionsRes.suggestedQuestions.length).toBe(5);
      expect(questionsRes.isFallback).toBe(true);
      expect(questionsRes.suggestedQuestions[0].category).toBe('Industry Expectations');
      expect(questionsRes.suggestedQuestions[0].question).toContain('differentiates an average fresher');
    });

    it('should summarize raw notes and extract action items with assignees and priorities', async () => {
      const rawNotes = `Discussed database indexing and Redis caching strategies.
Mentor recommended reading Designing Data-Intensive Applications chapter 3.
Student to push revised GitHub repository by Friday.
Mentor will share reference distributed tracing code.`;

      const summary = await MentorshipAiAssistantService.summarizeNotesAndActionItems(
        rawNotes,
        'Distributed Caching'
      );

      expect(summary.summary).toBeDefined();
      expect(summary.keyTakeaways.length).toBeGreaterThan(0);
      expect(summary.actionItems.length).toBe(3);
      expect(summary.actionItems.some((a) => a.assignee === 'STUDENT')).toBe(true);
      expect(summary.actionItems.some((a) => a.assignee === 'MENTOR')).toBe(true);
      expect(summary.isFallback).toBe(true);
    });
  });

  describe('4. Mentorship Verification & Request Lifecycle', () => {
    it('should reject mentorship requests sent to unverified mentors', async () => {
      const spyMentor = vi.spyOn(MentorProfile, 'findById').mockResolvedValueOnce({
        _id: 'prof_unverified',
        verificationStatus: 'PENDING',
        userId: 'u_mentor_pending',
      } as any);

      await expect(
        MentorshipService.createMentorshipRequest('student_123', {
          mentorProfileId: 'prof_unverified',
          topic: 'Resume Advice',
          objective: 'Review format',
          introduction: 'Hi, I am a 3rd year student',
        })
      ).rejects.toThrow('Mentorship can only be requested from verified mentors');

      spyMentor.mockRestore();
    });

    it('should reject self-mentorship requests', async () => {
      const spyMentor = vi.spyOn(MentorProfile, 'findById').mockResolvedValueOnce({
        _id: 'prof_self',
        verificationStatus: 'VERIFIED',
        userId: 'same_user_id',
      } as any);

      await expect(
        MentorshipService.createMentorshipRequest('same_user_id', {
          mentorProfileId: 'prof_self',
          topic: 'Mock Interview',
          objective: 'Test',
          introduction: 'Test',
        })
      ).rejects.toThrow('Cannot request mentorship from yourself');

      spyMentor.mockRestore();
    });

    it('should enforce mentor capacity limits and reject requests when maximum mentees reached', async () => {
      const spyMentor = vi.spyOn(MentorProfile, 'findById').mockResolvedValueOnce({
        _id: 'prof_full',
        verificationStatus: 'VERIFIED',
        userId: 'mentor_full',
        maximumMentees: 2,
        activeMenteeCount: 2, // Full capacity
      } as any);

      await expect(
        MentorshipService.createMentorshipRequest('student_123', {
          mentorProfileId: 'prof_full',
          topic: 'System Design',
          objective: 'Test',
          introduction: 'Test',
        })
      ).rejects.toThrow('maximum active mentee capacity');

      spyMentor.mockRestore();
    });

    it('should prevent duplicate pending requests to the same mentor', async () => {
      const spyMentor = vi.spyOn(MentorProfile, 'findById').mockResolvedValueOnce({
        _id: 'prof_ok',
        verificationStatus: 'VERIFIED',
        userId: 'mentor_target',
        maximumMentees: 5,
        activeMenteeCount: 0,
      } as any);

      const spyPending = vi.spyOn(MentorshipRequest, 'findOne').mockResolvedValueOnce({
        _id: 'existing_req_1',
        status: 'PENDING',
      } as any);

      await expect(
        MentorshipService.createMentorshipRequest('student_123', {
          mentorProfileId: 'prof_ok',
          topic: 'DSA Prep',
          objective: 'Review LeetCode',
          introduction: 'Test',
        })
      ).rejects.toThrow('already have a pending mentorship request');

      spyMentor.mockRestore();
      spyPending.mockRestore();
    });
  });

  describe('5. Notes Visibility & Security Isolation', () => {
    it('should enforce note privacy (PRIVATE notes visible only to author)', async () => {
      const spyRel = vi.spyOn(MentorshipRelationship, 'findById').mockResolvedValueOnce({
        _id: 'rel_test',
        studentId: 'student_user_1',
        mentorId: 'mentor_user_2',
      } as any);

      const spyNotes = vi.spyOn(MentorshipNote, 'find').mockReturnValue({
        sort: vi.fn().mockResolvedValue([
          {
            _id: 'note_1',
            relationshipId: 'rel_test',
            authorId: 'student_user_1',
            content: 'Private student prep notes',
            visibility: 'PRIVATE',
            createdAt: new Date(),
            toSafeObject: () => ({
              id: 'note_1',
              relationshipId: 'rel_test',
              authorId: 'student_user_1',
              content: 'Private student prep notes',
              visibility: 'PRIVATE' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }),
          },
        ]),
      } as any);

      const spyUsers = vi.spyOn(User, 'find').mockReturnValue({
        select: vi.fn().mockResolvedValue([{ _id: 'student_user_1', fullName: 'Student One' }]),
      } as any);

      const notes = await MentorshipService.getNotes('student_user_1', 'rel_test');
      expect(notes.length).toBe(1);
      expect(notes[0].visibility).toBe('PRIVATE');

      spyRel.mockRestore();
      spyNotes.mockRestore();
      spyUsers.mockRestore();
    });
  });

  describe('6. Route Authentication & RBAC Protection', () => {
    it('GET /api/mentorship/mentors should be accessible publicly (200)', async () => {
      const spyFind = vi.spyOn(MentorProfile, 'find').mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            sort: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any);
      const spyCount = vi.spyOn(MentorProfile, 'countDocuments').mockResolvedValue(0 as any);
      const spyUserFind = vi.spyOn(User, 'find').mockReturnValue({
        select: vi.fn().mockResolvedValue([]),
      } as any);

      const res = await request(app).get('/api/mentorship/mentors');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      spyFind.mockRestore();
      spyCount.mockRestore();
      spyUserFind.mockRestore();
    });

    it('GET /api/mentorship/recommendations should require authentication (401)', async () => {
      const res = await request(app).get('/api/mentorship/recommendations');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/mentorship/requests should require authentication (401)', async () => {
      const res = await request(app).post('/api/mentorship/requests').send({
        mentorProfileId: '123',
        topic: 'Test',
      });
      expect(res.status).toBe(401);
    });

    it('GET /api/mentorship/relationships should require authentication (401)', async () => {
      const res = await request(app).get('/api/mentorship/relationships');
      expect(res.status).toBe(401);
    });

    it('GET /api/mentorship/college/analytics should require authentication (401)', async () => {
      const res = await request(app).get('/api/mentorship/college/analytics');
      expect(res.status).toBe(401);
    });

    it('GET /api/mentorship/admin/verifications should require authentication (401)', async () => {
      const res = await request(app).get('/api/mentorship/admin/verifications');
      expect(res.status).toBe(401);
    });

    it('PATCH /api/mentorship/admin/verifications/123 should require authentication (401)', async () => {
      const res = await request(app).patch('/api/mentorship/admin/verifications/123').send({
        status: 'VERIFIED',
      });
      expect(res.status).toBe(401);
    });

    it('POST /api/mentorship/ai/prepare-agenda should require authentication (401)', async () => {
      const res = await request(app).post('/api/mentorship/ai/prepare-agenda').send({
        topic: 'DSA',
        objective: 'Practice',
      });
      expect(res.status).toBe(401);
    });
  });
});
