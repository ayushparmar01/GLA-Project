import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationDropdown } from '../components/notifications/NotificationDropdown';
import { CareerEventsView } from '../components/events/CareerEventsView';
import { CommunicationCentreView } from '../components/communication/CommunicationCentreView';
import * as api from '../services/api';
import {
  NotificationData,
  CareerEventData,
  EventRegistrationData,
  AnnouncementData,
} from '../types';

vi.mock('../services/api');

const mockNotifications: NotificationData[] = [
  {
    id: 'notif-1',
    recipientId: 'user-1',
    type: 'INTERVIEW_SCHEDULED',
    title: 'Technical Round 1 Scheduled',
    message: 'Your interview with Cloud Bharat is scheduled for Friday at 3:00 PM.',
    relatedEntityType: 'INTERVIEW',
    relatedEntityId: 'int-101',
    readAt: null,
    createdAt: '2026-10-30T10:00:00.000Z',
    isRead: false,
  },
  {
    id: 'notif-2',
    recipientId: 'user-1',
    type: 'EVENT_REGISTRATION_CONFIRMED',
    title: 'Event Registration Confirmed',
    message: 'You have registered for the Full-Stack Masterclass.',
    relatedEntityType: 'CAREER_EVENT',
    relatedEntityId: 'ev-201',
    readAt: '2026-10-30T10:05:00.000Z',
    createdAt: '2026-10-30T10:02:00.000Z',
    isRead: true,
  },
];

const mockCareerEvent: CareerEventData = {
  id: 'ev-201',
  title: 'Full-Stack Web Dev Masterclass',
  description: 'Live interactive workshop covering React 19 and scalable Node.js architectures for campus placement.',
  eventType: 'WORKSHOP',
  organizerId: 'org-college-1',
  organizerRole: 'COLLEGE',
  organizerName: 'Govt Engineering College TPO',
  startAt: '2026-11-10T10:00:00.000Z',
  endAt: '2026-11-10T12:00:00.000Z',
  location: 'Virtual / Google Meet',
  meetingUrl: 'https://meet.google.com/abc-defg-hij',
  registrationDeadline: '2026-11-08T23:59:59.000Z',
  capacity: 100,
  registeredCount: 45,
  isFull: false,
  isDeadlinePassed: false,
  status: 'PUBLISHED',
  tags: ['React', 'Node.js'],
  createdAt: '2026-10-30T10:00:00.000Z',
  updatedAt: '2026-10-30T10:00:00.000Z',
  isRegistered: false,
};

const mockAnnouncement: AnnouncementData = {
  id: 'ann-301',
  title: 'Mandatory Placement Desk Verification',
  content: 'All final year diploma and degree engineering students must complete their profile verification before the upcoming drive.',
  authorId: 'col-1',
  authorRole: 'COLLEGE',
  authorName: 'Govt Engineering College Placement Cell',
  targetAudience: 'COLLEGE_STUDENTS',
  priority: 'HIGH',
  createdAt: '2026-10-30T10:00:00.000Z',
};

describe('Phase 8: Notification Engine, Communication Centre & Career Events (Frontend Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. NotificationDropdown Component', () => {
    it('should render notification bell with unread badge and open dropdown on click', async () => {
      vi.mocked(api.fetchUnreadNotificationCountApi).mockResolvedValue({
        success: true,
        data: { unreadCount: 1 },
      });
      vi.mocked(api.fetchNotificationsApi).mockResolvedValue({
        success: true,
        data: mockNotifications,
      });

      render(<NotificationDropdown token="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeDefined();
      });

      // Click the bell button
      const bellBtn = screen.getByLabelText('Notifications');
      fireEvent.click(bellBtn);

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeDefined();
        expect(screen.getByText('Technical Round 1 Scheduled')).toBeDefined();
        expect(screen.getByText('Event Registration Confirmed')).toBeDefined();
      });
    });

    it('should allow marking a notification as read', async () => {
      vi.mocked(api.fetchUnreadNotificationCountApi).mockResolvedValue({
        success: true,
        data: { unreadCount: 1 },
      });
      vi.mocked(api.fetchNotificationsApi).mockResolvedValue({
        success: true,
        data: mockNotifications,
      });
      vi.mocked(api.markNotificationAsReadApi).mockResolvedValue({
        success: true,
        data: { ...mockNotifications[0], isRead: true, readAt: new Date().toISOString() },
      });

      render(<NotificationDropdown token="test-token" />);

      const bellBtn = screen.getByLabelText('Notifications');
      fireEvent.click(bellBtn);

      await waitFor(() => {
        expect(screen.getByText('Technical Round 1 Scheduled')).toBeDefined();
      });

      const markReadBtn = screen.getByText('Mark as read');
      fireEvent.click(markReadBtn);

      await waitFor(() => {
        expect(api.markNotificationAsReadApi).toHaveBeenCalledWith('notif-1', 'test-token');
      });
    });

    it('should allow marking all notifications as read', async () => {
      vi.mocked(api.fetchUnreadNotificationCountApi).mockResolvedValue({
        success: true,
        data: { unreadCount: 1 },
      });
      vi.mocked(api.fetchNotificationsApi).mockResolvedValue({
        success: true,
        data: mockNotifications,
      });
      vi.mocked(api.markAllNotificationsAsReadApi).mockResolvedValue({
        success: true,
        data: { modifiedCount: 1 },
      });

      render(<NotificationDropdown token="test-token" />);

      const bellBtn = screen.getByLabelText('Notifications');
      fireEvent.click(bellBtn);

      await waitFor(() => {
        expect(screen.getByText('Mark all read')).toBeDefined();
      });

      const markAllBtn = screen.getByText('Mark all read');
      fireEvent.click(markAllBtn);

      await waitFor(() => {
        expect(api.markAllNotificationsAsReadApi).toHaveBeenCalledWith('test-token');
      });
    });
  });

  describe('2. CareerEventsView Component', () => {
    it('should render event cards and allow students to register', async () => {
      vi.mocked(api.fetchCareerEventsApi).mockResolvedValue({
        success: true,
        data: [mockCareerEvent],
      });
      vi.mocked(api.registerForCareerEventApi).mockResolvedValue({
        success: true,
        data: {
          id: 'reg-1',
          eventId: 'ev-201',
          userId: 'user-1',
          registrationStatus: 'REGISTERED',
          registeredAt: new Date().toISOString(),
          attendanceStatus: 'NOT_RECORDED',
        },
      });

      render(
        <CareerEventsView
          token="test-token"
          userRole="STUDENT"
          userId="user-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Full-Stack Web Dev Masterclass')).toBeDefined();
      });

      expect(screen.getByText('Career Events & Workshops')).toBeDefined();
      expect(screen.getByText(/45 \/ 100 seats filled/)).toBeDefined();

      const registerBtn = screen.getByText('Register for Event');
      fireEvent.click(registerBtn);

      await waitFor(() => {
        expect(api.registerForCareerEventApi).toHaveBeenCalledWith('ev-201', 'test-token');
        expect(screen.getByText(/Registration confirmed/)).toBeDefined();
      });
    });

    it('should allow students to cancel their registration', async () => {
      const registeredEvent: CareerEventData = {
        ...mockCareerEvent,
        isRegistered: true,
      };

      vi.mocked(api.fetchCareerEventsApi).mockResolvedValue({
        success: true,
        data: [registeredEvent],
      });
      vi.mocked(api.cancelCareerEventRegistrationApi).mockResolvedValue({
        success: true,
      });

      // Mock window.confirm
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <CareerEventsView
          token="test-token"
          userRole="STUDENT"
          userId="user-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Registered')).toBeDefined();
      });

      const cancelBtn = screen.getByText('Cancel');
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(api.cancelCareerEventRegistrationApi).toHaveBeenCalledWith('ev-201', 'test-token');
      });
    });

    it('should allow event organizers to view the attendees list modal', async () => {
      const organizerEvent: CareerEventData = {
        ...mockCareerEvent,
        organizerId: 'col-1',
      };

      vi.mocked(api.fetchCareerEventsApi).mockResolvedValue({
        success: true,
        data: [organizerEvent],
      });
      vi.mocked(api.fetchEventRegistrationsApi).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'reg-1',
            eventId: 'ev-201',
            userId: 'stud-1',
            registrationStatus: 'REGISTERED',
            registeredAt: '2026-10-30T10:00:00.000Z',
            attendanceStatus: 'NOT_RECORDED',
            studentSnapshot: {
              fullName: 'Aarav Patel',
              email: 'aarav@district.edu.in',
              course: 'B.Tech CSE',
              collegeName: 'Govt Engineering College',
            },
          },
        ],
      });

      render(
        <CareerEventsView
          token="test-token"
          userRole="COLLEGE"
          userId="col-1"
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/View Attendees/)).toBeDefined();
      });

      const viewAttendeesBtn = screen.getByText(/View Attendees/);
      fireEvent.click(viewAttendeesBtn);

      await waitFor(() => {
        expect(screen.getByText('Registered Attendees')).toBeDefined();
        expect(screen.getByText('Aarav Patel')).toBeDefined();
        expect(screen.getByText('aarav@district.edu.in')).toBeDefined();
      });
    });
  });

  describe('3. CommunicationCentreView Component', () => {
    it('should render announcements with priority badges', async () => {
      vi.mocked(api.fetchAnnouncementsApi).mockResolvedValue({
        success: true,
        data: [mockAnnouncement],
      });

      render(
        <CommunicationCentreView
          token="test-token"
          userRole="STUDENT"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Mandatory Placement Desk Verification')).toBeDefined();
      });

      expect(screen.getByText('Communication Centre')).toBeDefined();
      expect(screen.getByText('High Priority')).toBeDefined();
      expect(screen.getByText(/All final year diploma and degree engineering/)).toBeDefined();
    });

    it('should allow COLLEGE user to broadcast an announcement', async () => {
      vi.mocked(api.fetchAnnouncementsApi).mockResolvedValue({
        success: true,
        data: [],
      });
      vi.mocked(api.createAnnouncementApi).mockResolvedValue({
        success: true,
        data: mockAnnouncement,
      });

      render(
        <CommunicationCentreView
          token="test-token"
          userRole="COLLEGE"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Broadcast Announcement')).toBeDefined();
      });

      // Open modal
      const openBtn = screen.getByText('Broadcast Announcement');
      fireEvent.click(openBtn);

      expect(screen.getByText('Broadcast Notice')).toBeDefined();

      // Fill form
      const titleInput = screen.getByPlaceholderText(/Mandatory Placement Drive Document Verification/);
      const contentInput = screen.getByPlaceholderText(/Write clear instructions/);

      fireEvent.change(titleInput, { target: { value: 'Mandatory Placement Desk Verification' } });
      fireEvent.change(contentInput, { target: { value: 'All final year students must verify profiles.' } });

      const submitBtn = screen.getByText('Broadcast Notice');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(api.createAnnouncementApi).toHaveBeenCalled();
        expect(screen.getByText(/Announcement broadcasted successfully/)).toBeDefined();
      });
    });
  });
});
