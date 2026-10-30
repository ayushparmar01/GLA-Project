import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MentorCard } from '../components/mentorship/MentorCard';
import { RequestMentorshipModal } from '../components/mentorship/RequestMentorshipModal';
import { MentorDiscoveryDashboard } from '../components/mentorship/MentorDiscoveryDashboard';
import { SessionSchedulingModal } from '../components/mentorship/SessionSchedulingModal';
import { MentorshipMessagingDrawer } from '../components/mentorship/MentorshipMessagingDrawer';
import { AIMentorshipAssistantPanel } from '../components/mentorship/AIMentorshipAssistantPanel';
import { MentorshipFeedbackModal } from '../components/mentorship/MentorshipFeedbackModal';
import { GroupMentorshipView } from '../components/mentorship/GroupMentorshipView';
import { CollegeMentorshipAnalyticsCard } from '../components/mentorship/CollegeMentorshipAnalyticsCard';
import { AdminMentorVerificationCard } from '../components/mentorship/AdminMentorVerificationCard';
import * as api from '../services/api';

vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    fetchVerifiedMentorsApi: vi.fn(),
    fetchMentorRecommendationsApi: vi.fn(),
    createMentorshipRequestApi: vi.fn(),
    scheduleMentorshipSessionApi: vi.fn(),
    fetchMentorshipMessagesApi: vi.fn(),
    sendMentorshipMessageApi: vi.fn(),
    aiPrepareMentorshipAgendaApi: vi.fn(),
    aiSuggestMentorshipQuestionsApi: vi.fn(),
    aiSummarizeMentorshipNotesApi: vi.fn(),
    submitMentorshipFeedbackApi: vi.fn(),
    fetchGroupMentorshipSessionsApi: vi.fn(),
    joinGroupMentorshipSessionApi: vi.fn(),
    leaveGroupMentorshipSessionApi: vi.fn(),
    fetchCollegeMentorshipAnalyticsApi: vi.fn(),
    fetchAdminMentorVerificationQueueApi: vi.fn(),
    reviewAdminMentorVerificationApi: vi.fn(),
    fetchAdminMentorshipAnalyticsApi: vi.fn(),
  };
});

describe('Phase 16 — Advanced AI-Powered Mentorship & Industry Connect Platform UI Tests', () => {
  const mockMentor = {
    id: 'm_101',
    userId: 'u_101',
    fullName: 'Ananya Sharma',
    email: 'ananya@google.com',
    organization: 'Google India',
    designation: 'Senior Software Engineer',
    experienceYears: 5,
    industry: 'Software & IT',
    expertise: ['React', 'TypeScript', 'System Design', 'Cloud Architecture'],
    mentorshipTopics: ['Mock Technical Interview', 'Resume Review', 'Campus Placement Strategy'],
    bio: 'Passionate about guiding rural and Tier-2 engineering students into top-tier tech roles.',
    languages: ['English', 'Hindi'],
    isAlumni: true,
    maximumMentees: 4,
    activeMenteeCount: 1,
    verificationStatus: 'VERIFIED' as const,
    availableDays: ['Saturday', 'Sunday'],
    timeSlots: [],
    ratingAverage: 4.9,
    totalReviews: 18,
    totalSessionsCompleted: 35,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockRecommendation = {
    mentor: mockMentor,
    compatibilityScore: 92,
    matchCategory: 'EXCELLENT_MATCH' as const,
    factors: {
      expertiseAlignment: 28,
      goalAlignment: 19,
      industryAlignment: 15,
      topicAlignment: 14,
      languageMatch: 10,
      availabilityScore: 6,
    },
    positiveMatchReasons: [
      'Verified College Alumni Mentor',
      'Matches 3 of your key technical skills (React, TypeScript)',
      'Fluent in your preferred languages: English & Hindi',
    ],
    potentialGaps: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Mentor Card Component', () => {
    it('should render mentor details, company, designation, verification badge, and alumni tag', () => {
      const onRequest = vi.fn();
      render(<MentorCard mentor={mockMentor} onRequestMentorship={onRequest} />);

      expect(screen.getByText('Ananya Sharma')).toBeInTheDocument();
      expect(screen.getByText(/Senior Software Engineer/i)).toBeInTheDocument();
      expect(screen.getByText('Google India')).toBeInTheDocument();
      expect(screen.getByText(/5 Years Exp/i)).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Alumni')).toBeInTheDocument();
      expect(screen.getByText('4.9')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /Request Mentorship/i });
      fireEvent.click(btn);
      expect(onRequest).toHaveBeenCalledWith(mockMentor);
    });

    it('should display AI compatibility score and explainable match reasons when recommendation is provided', () => {
      render(
        <MentorCard
          mentor={mockMentor}
          recommendation={mockRecommendation}
          onRequestMentorship={vi.fn()}
        />
      );

      expect(screen.getByText(/AI Compatibility: 92%/i)).toBeInTheDocument();
      expect(screen.getByText(/Excellent Match/i)).toBeInTheDocument();
      expect(screen.getByText(/Verified College Alumni Mentor/i)).toBeInTheDocument();
      expect(screen.getByText(/Matches 3 of your key technical skills/i)).toBeInTheDocument();
    });
  });

  describe('2. Request Mentorship Modal Component', () => {
    it('should render form fields, validate inputs, and submit mentorship request', async () => {
      const handleSuccess = vi.fn();
      const handleClose = vi.fn();

      vi.mocked(api.createMentorshipRequestApi).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'req_123',
          studentId: 'stud_1',
          mentorId: 'u_101',
          mentorProfileId: 'm_101',
          topic: 'System Design Guidance',
          objective: 'Need advice on designing scalable APIs',
          introduction: 'Final year B.Tech student',
          preferredFormat: 'ONE_ON_ONE',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      render(
        <RequestMentorshipModal
          mentor={mockMentor}
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
          token="test_token"
        />
      );

      expect(screen.getByText(/Request Mentorship Guidance/i)).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Mock Technical Interview/i), {
        target: { value: 'System Design Guidance' },
      });
      fireEvent.change(
        screen.getByPlaceholderText(/What specific skills, questions, or goals/i),
        { target: { value: 'Need advice on designing scalable APIs' } }
      );
      fireEvent.change(
        screen.getByPlaceholderText(/Introduce your academic background/i),
        { target: { value: 'Final year B.Tech student' } }
      );

      fireEvent.click(screen.getByRole('button', { name: /Submit Request/i }));

      await waitFor(() => {
        expect(api.createMentorshipRequestApi).toHaveBeenCalledWith(
          expect.objectContaining({
            mentorProfileId: 'm_101',
            topic: 'System Design Guidance',
            objective: 'Need advice on designing scalable APIs',
            introduction: 'Final year B.Tech student',
          }),
          'test_token'
        );
        expect(handleSuccess).toHaveBeenCalled();
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });

  describe('3. Mentor Discovery Dashboard Component', () => {
    it('should render AI recommendations and directory search filters', async () => {
      vi.mocked(api.fetchMentorRecommendationsApi).mockResolvedValueOnce({
        success: true,
        data: [mockRecommendation],
      });
      vi.mocked(api.fetchVerifiedMentorsApi).mockResolvedValueOnce({
        success: true,
        data: {
          mentors: [mockMentor],
          total: 1,
          page: 1,
          totalPages: 1,
        },
      });

      render(<MentorDiscoveryDashboard token="test_token" />);

      await waitFor(() => {
        expect(screen.getByText(/AI-Powered Industry Mentorship/i)).toBeInTheDocument();
        expect(screen.getByText(/AI Recommendations \(1\)/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Search by company, title, skill/i)).toBeInTheDocument();
        expect(screen.getByText(/College Alumni Mentors Only/i)).toBeInTheDocument();
      });
    });
  });

  describe('4. Session Scheduling Modal Component', () => {
    it('should schedule a 1-on-1 session with meeting link validation', async () => {
      const handleSuccess = vi.fn();
      const handleClose = vi.fn();

      vi.mocked(api.scheduleMentorshipSessionApi).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'sess_123',
          relationshipId: 'rel_1',
          mentorId: 'u_101',
          studentId: 's_1',
          title: 'Resume Review Call',
          sessionTopic: 'ATS Optimization',
          scheduledStart: new Date(Date.now() + 86400000).toISOString(),
          scheduledEnd: new Date(Date.now() + 86400000 + 45 * 60000).toISOString(),
          durationMinutes: 45,
          sessionType: 'ONE_ON_ONE',
          meetingLink: 'https://meet.careerbridge.in/session-123',
          status: 'CONFIRMED',
          agenda: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      render(
        <SessionSchedulingModal
          relationshipId="rel_1"
          defaultTopic="ATS Optimization"
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
          token="test_token"
        />
      );

      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      // Fill in form
      const dateInput = screen.getByLabelText(/Date/i);
      fireEvent.change(dateInput, { target: { value: futureDate } });

      fireEvent.click(screen.getByRole('button', { name: /Schedule Session/i }));

      await waitFor(() => {
        expect(api.scheduleMentorshipSessionApi).toHaveBeenCalled();
        expect(handleSuccess).toHaveBeenCalled();
        expect(handleClose).toHaveBeenCalled();
      });
    });
  });

  describe('5. Mentorship Messaging Drawer Component', () => {
    it('should load message thread and send a new message', async () => {
      vi.mocked(api.fetchMentorshipMessagesApi).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'msg_1',
            relationshipId: 'rel_1',
            senderId: 'other_user',
            senderName: 'Mentor Ananya',
            receiverId: 'my_user',
            content: 'Hello! Looking forward to reviewing your resume tomorrow.',
            createdAt: new Date().toISOString(),
          },
        ],
      });

      vi.mocked(api.sendMentorshipMessageApi).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'msg_2',
          relationshipId: 'rel_1',
          senderId: 'my_user',
          receiverId: 'other_user',
          content: 'Thank you! I have uploaded my updated draft.',
          createdAt: new Date().toISOString(),
        },
      });

      render(
        <MentorshipMessagingDrawer
          relationshipId="rel_1"
          currentUserId="my_user"
          counterpartName="Mentor Ananya"
          isOpen={true}
          onClose={vi.fn()}
          token="test_token"
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Looking forward to reviewing your resume tomorrow/i)
        ).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/Type a message\.\.\./i);
      fireEvent.change(input, {
        target: { value: 'Thank you! I have uploaded my updated draft.' },
      });
      fireEvent.click(screen.getByTitle('Send'));

      await waitFor(() => {
        expect(api.sendMentorshipMessageApi).toHaveBeenCalledWith(
          'rel_1',
          'Thank you! I have uploaded my updated draft.',
          'test_token'
        );
        expect(
          screen.getByText(/Thank you! I have uploaded my updated draft/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('6. AI Mentorship Assistant Panel Component', () => {
    it('should generate a 45-minute structured agenda', async () => {
      vi.mocked(api.aiPrepareMentorshipAgendaApi).mockResolvedValueOnce({
        success: true,
        data: {
          topic: 'System Design',
          durationMinutes: 45,
          agendaItems: [
            { timeSlot: '00:00 - 00:05', topic: 'Context Setting', notes: 'Review goals' },
            { timeSlot: '00:05 - 00:20', topic: 'Architecture Teardown', notes: 'Examine API' },
            { timeSlot: '00:20 - 00:35', topic: 'Trade-offs & Scalability', notes: 'Cache & DB' },
            { timeSlot: '00:35 - 00:45', topic: 'Action Items', notes: 'Next steps' },
          ],
          suggestedPreparation: ['Review LRU Cache mechanism'],
          isFallback: true,
        },
      });

      render(
        <AIMentorshipAssistantPanel
          relationshipTopic="System Design"
          relationshipObjective="Prepare for interview"
          token="test_token"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Generate Structured 45-Min Agenda/i }));

      await waitFor(() => {
        expect(api.aiPrepareMentorshipAgendaApi).toHaveBeenCalled();
        expect(screen.getByText('45-Minute Session Timeline')).toBeInTheDocument();
        expect(screen.getByText('Architecture Teardown')).toBeInTheDocument();
        expect(screen.getByText(/Review LRU Cache mechanism/i)).toBeInTheDocument();
      });
    });
  });

  describe('7. Mentorship Feedback Modal Component', () => {
    it('should submit a 5-star rating with strengths and written feedback', async () => {
      const handleSuccess = vi.fn();
      const handleClose = vi.fn();

      vi.mocked(api.submitMentorshipFeedbackApi).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'fb_1',
          relationshipId: 'rel_1',
          submittedBy: 'stud_1',
          targetUserId: 'mentor_1',
          role: 'STUDENT',
          rating: 5,
          writtenFeedback: 'Fantastic mentorship session! Learned so much about system architecture.',
          strengthsHighlight: ['Clear Explanations', 'Actionable Feedback'],
          areasToImprove: [],
          isPublic: true,
          createdAt: new Date().toISOString(),
        },
      });

      render(
        <MentorshipFeedbackModal
          relationshipId="rel_1"
          isOpen={true}
          onClose={handleClose}
          onSuccess={handleSuccess}
          token="test_token"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Clear Explanations' }));
      fireEvent.change(
        screen.getByPlaceholderText(/What went well\? How did this session help/i),
        { target: { value: 'Fantastic mentorship session! Learned so much about system architecture.' } }
      );

      fireEvent.click(screen.getByRole('button', { name: /Submit Review/i }));

      await waitFor(() => {
        expect(api.submitMentorshipFeedbackApi).toHaveBeenCalledWith(
          'rel_1',
          expect.objectContaining({
            rating: 5,
            writtenFeedback: 'Fantastic mentorship session! Learned so much about system architecture.',
            strengthsHighlight: ['Clear Explanations'],
          }),
          'test_token'
        );
        expect(handleSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('8. Group Mentorship View Component', () => {
    it('should list group sessions with capacity and allow joining', async () => {
      vi.mocked(api.fetchGroupMentorshipSessionsApi).mockResolvedValueOnce({
        success: true,
        data: [
          {
            id: 'grp_1',
            mentorId: 'u_101',
            mentorName: 'Ananya Sharma',
            title: 'System Design Masterclass',
            description: 'Live interactive breakdown of distributed caches.',
            topic: 'System Design',
            maximumParticipants: 30,
            currentParticipantCount: 12,
            memberIds: [],
            scheduledStart: new Date(Date.now() + 86400000).toISOString(),
            scheduledEnd: new Date(Date.now() + 86400000 + 3600000).toISOString(),
            meetingLink: 'https://meet.careerbridge.in/grp-1',
            status: 'SCHEDULED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      vi.mocked(api.joinGroupMentorshipSessionApi).mockResolvedValueOnce({
        success: true,
        data: {
          id: 'grp_1',
          mentorId: 'u_101',
          title: 'System Design Masterclass',
          description: 'Live interactive breakdown of distributed caches.',
          topic: 'System Design',
          maximumParticipants: 30,
          currentParticipantCount: 13,
          memberIds: ['my_student_id'],
          scheduledStart: new Date(Date.now() + 86400000).toISOString(),
          scheduledEnd: new Date(Date.now() + 86400000 + 3600000).toISOString(),
          meetingLink: 'https://meet.careerbridge.in/grp-1',
          status: 'SCHEDULED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      render(<GroupMentorshipView currentUserId="my_student_id" token="test_token" />);

      await waitFor(() => {
        expect(screen.getByText('System Design Masterclass')).toBeInTheDocument();
        expect(screen.getByText('12/30 Seats')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Reserve Spot/i }));

      await waitFor(() => {
        expect(api.joinGroupMentorshipSessionApi).toHaveBeenCalledWith('grp_1', 'test_token');
      });
    });
  });

  describe('9. College Mentorship Analytics Card Component', () => {
    it('should display alumni metrics, satisfaction scores, and privacy safeguards', async () => {
      vi.mocked(api.fetchCollegeMentorshipAnalyticsApi).mockResolvedValueOnce({
        success: true,
        data: {
          collegeId: 'col_1',
          collegeName: 'Bharat Institute of Technology',
          totalAlumniMentors: 14,
          verifiedAlumniMentors: 11,
          totalMentorshipSessions: 48,
          activeStudentMentees: 22,
          averageSatisfactionRating: 4.8,
          topMentorshipTopics: [
            { topic: 'Mock Technical Interview', count: 24 },
            { topic: 'Resume Review', count: 18 },
          ],
          topIndustriesRepresented: [{ industry: 'Software & IT', count: 9 }],
          generatedAt: new Date().toISOString(),
        },
      });

      render(<CollegeMentorshipAnalyticsCard token="test_token" />);

      await waitFor(() => {
        expect(
          screen.getByText(/Alumni Mentorship & Industry Connect Intelligence/i)
        ).toBeInTheDocument();
        expect(screen.getByText('14')).toBeInTheDocument();
        expect(screen.getByText('(11 verified)')).toBeInTheDocument();
        expect(screen.getByText('22')).toBeInTheDocument();
        expect(screen.getByText('48')).toBeInTheDocument();
        expect(screen.getByText('4.8')).toBeInTheDocument();
        expect(screen.getByText(/Student Privacy Guaranteed/i)).toBeInTheDocument();
        expect(screen.getByText(/Mock Technical Interview/i)).toBeInTheDocument();
      });
    });
  });

  describe('10. Admin Mentor Verification Card Component', () => {
    it('should display pending verification queue, evidence, and support approval', async () => {
      const pendingMentor = {
        ...mockMentor,
        id: 'prof_pending',
        fullName: 'Rahul Verma',
        verificationStatus: 'PENDING' as const,
        verificationEvidence: {
          workEmail: 'rahul.verma@microsoft.com',
          submissionNotes: 'Senior backend architect with 8 years experience.',
        },
      };

      vi.mocked(api.fetchAdminMentorVerificationQueueApi).mockResolvedValueOnce({
        success: true,
        data: [pendingMentor],
      });
      vi.mocked(api.fetchAdminMentorshipAnalyticsApi).mockResolvedValueOnce({
        success: true,
        data: {
          totalMentorsRegistered: 30,
          verifiedMentors: 24,
          pendingVerifications: 1,
          rejectedMentors: 2,
          suspendedMentors: 3,
          totalActiveRelationships: 15,
          totalSessionsConducted: 85,
          averagePlatformRating: 4.9,
          popularMentorshipTopics: [],
          topIndustries: [],
          generatedAt: new Date().toISOString(),
        },
      });

      vi.mocked(api.reviewAdminMentorVerificationApi).mockResolvedValueOnce({
        success: true,
        data: { ...pendingMentor, verificationStatus: 'VERIFIED' },
      });

      render(<AdminMentorVerificationCard token="test_token" />);

      await waitFor(() => {
        expect(screen.getByText(/Mentor Credentials & Verification Desk/i)).toBeInTheDocument();
        expect(screen.getByText('Rahul Verma')).toBeInTheDocument();
        expect(screen.getByText('rahul.verma@microsoft.com')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Approve/i }));

      await waitFor(() => {
        expect(api.reviewAdminMentorVerificationApi).toHaveBeenCalledWith(
          'prof_pending',
          { status: 'VERIFIED' },
          'test_token'
        );
      });
    });
  });
});
