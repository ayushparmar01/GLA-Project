import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhatsAppIntegrationCard } from '../components/whatsapp/WhatsAppIntegrationCard';
import { WhatsAppAssistantPreview } from '../components/whatsapp/WhatsAppAssistantPreview';
import { AdminWhatsAppControlCard } from '../components/admin/AdminWhatsAppControlCard';
import * as api from '../services/api';
import {
  WhatsAppStatusData,
  WhatsAppAdminAnalytics,
  WhatsAppIntegrationStatusReport,
  WhatsAppWebhookEventData,
} from '../types';

// Mock the API module
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    fetchWhatsAppStatusApi: vi.fn(),
    requestWhatsAppLinkCodeApi: vi.fn(),
    verifyWhatsAppLinkCodeApi: vi.fn(),
    unlinkWhatsAppAccountApi: vi.fn(),
    updateWhatsAppPreferencesApi: vi.fn(),
    fetchWhatsAppAdminStatusApi: vi.fn(),
    fetchWhatsAppAdminAnalyticsApi: vi.fn(),
    fetchWhatsAppAdminEventsApi: vi.fn(),
    sendWhatsAppTestMessageApi: vi.fn(),
  };
});

describe('Phase 10 — Advanced WhatsApp Career Assistant Frontend Suites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WhatsAppIntegrationCard — Student Account Linking & Preferences', () => {
    const unlinkedStatus: WhatsAppStatusData = {
      isLinked: false,
      whatsappEnabled: true,
      businessPhoneNumber: '+91 98765 43210',
    };

    const linkedStatus: WhatsAppStatusData = {
      isLinked: true,
      whatsappEnabled: true,
      businessPhoneNumber: '+91 98765 43210',
      account: {
        id: 'wa-acc-101',
        userId: 'usr-student-1',
        phoneNumber: '919876500001',
        isVerified: true,
        consentGiven: true,
        jobAlertsEnabled: true,
        applicationUpdatesEnabled: true,
        interviewAlertsEnabled: true,
        careerTipsEnabled: false,
        linkedAt: '2026-10-30T10:00:00.000Z',
      },
    };

    it('renders unlinked state with feature benefits and link action', async () => {
      vi.mocked(api.fetchWhatsAppStatusApi).mockResolvedValueOnce({
        success: true,
        data: unlinkedStatus,
      });

      render(<WhatsAppIntegrationCard token="mock-jwt" />);

      expect(await screen.findByText('WhatsApp Career Assistant')).toBeInTheDocument();
      expect(screen.getByText('Not Linked')).toBeInTheDocument();
      expect(screen.getByText('Instant Job Alerts')).toBeInTheDocument();
      expect(screen.getByText('Application Tracking')).toBeInTheDocument();
      expect(screen.getByText('Link WhatsApp Account')).toBeInTheDocument();
    });

    it('opens linking modal, submits phone number, and displays 6-character code with timer', async () => {
      vi.mocked(api.fetchWhatsAppStatusApi).mockResolvedValueOnce({
        success: true,
        data: unlinkedStatus,
      });
      vi.mocked(api.requestWhatsAppLinkCodeApi).mockResolvedValueOnce({
        success: true,
        data: {
          code: 'CB8492',
          expiresInSeconds: 300,
          phoneNumber: '+919876543210',
          message: 'Linking code generated successfully.',
        },
      });

      render(<WhatsAppIntegrationCard token="mock-jwt" />);

      const linkBtn = await screen.findByText('Link WhatsApp Account');
      fireEvent.click(linkBtn);

      expect(screen.getByText('Connect WhatsApp Career Assistant')).toBeInTheDocument();

      const phoneInput = screen.getByPlaceholderText(/98765 43210/);
      fireEvent.change(phoneInput, { target: { value: '9876543210' } });

      const genBtn = screen.getByText('Generate Secure Link Code');
      fireEvent.click(genBtn);

      await waitFor(() => {
        expect(screen.getByText('CB8492')).toBeInTheDocument();
      });

      expect(screen.getByText(/Send this code from WhatsApp/)).toBeInTheDocument();
    });

    it('renders linked account information with verified badge and formatted phone', async () => {
      vi.mocked(api.fetchWhatsAppStatusApi).mockResolvedValueOnce({
        success: true,
        data: linkedStatus,
      });

      render(<WhatsAppIntegrationCard token="mock-jwt" />);

      expect(await screen.findByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('+91 919876500001')).toBeInTheDocument();
      expect(screen.getByText('Verified')).toBeInTheDocument();
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.getByText('Unlink Account')).toBeInTheDocument();
    });

    it('toggles notification preferences and updates server state', async () => {
      vi.mocked(api.fetchWhatsAppStatusApi).mockResolvedValueOnce({
        success: true,
        data: linkedStatus,
      });
      vi.mocked(api.updateWhatsAppPreferencesApi).mockResolvedValueOnce({
        success: true,
        data: {
          jobAlertsEnabled: true,
          applicationUpdatesEnabled: true,
          interviewAlertsEnabled: true,
          careerTipsEnabled: true,
        },
      });

      render(<WhatsAppIntegrationCard token="mock-jwt" />);

      await screen.findByText('Connected');

      const careerTipsToggle = screen.getByRole('checkbox', { name: /AI Career Guidance & Tips/i });
      expect(careerTipsToggle).not.toBeChecked();

      fireEvent.click(careerTipsToggle);

      await waitFor(() => {
        expect(api.updateWhatsAppPreferencesApi).toHaveBeenCalledWith(
          expect.objectContaining({ careerTipsEnabled: true }),
          'mock-jwt'
        );
      });
    });

    it('triggers unlink flow with confirmation and resets to unlinked status', async () => {
      vi.mocked(api.fetchWhatsAppStatusApi).mockResolvedValueOnce({
        success: true,
        data: linkedStatus,
      });
      vi.mocked(api.unlinkWhatsAppAccountApi).mockResolvedValueOnce({
        success: true,
        data: { message: 'WhatsApp account successfully unlinked.' },
      });

      render(<WhatsAppIntegrationCard token="mock-jwt" />);

      const unlinkBtn = await screen.findByText('Unlink Account');
      fireEvent.click(unlinkBtn);

      // Confirmation button appears
      const confirmBtn = screen.getByText('Confirm Unlink');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(api.unlinkWhatsAppAccountApi).toHaveBeenCalledWith('mock-jwt');
        expect(screen.getByText('Not Linked')).toBeInTheDocument();
      });
    });
  });

  describe('WhatsAppAssistantPreview — Interactive Conversational Simulator', () => {
    it('renders simulator modal with demo badge and initial conversational menu', () => {
      const handleClose = vi.fn();
      render(<WhatsAppAssistantPreview onClose={handleClose} isLiveConfigured={false} />);

      expect(screen.getByText('CareerBridge Assistant')).toBeInTheDocument();
      expect(screen.getByText('DEMO SIMULATOR')).toBeInTheDocument();
      expect(screen.getByText(/Welcome to CareerBridge/)).toBeInTheDocument();
      expect(screen.getByText(/Find Jobs & Internships/)).toBeInTheDocument();

      const closeBtn = screen.getByTitle('Close preview');
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalled();
    });

    it('handles user sending "1" or "JOBS" and displays simulated job listings', async () => {
      render(<WhatsAppAssistantPreview isLiveConfigured={false} />);

      const input = screen.getByPlaceholderText('Type a command or message...');
      fireEvent.change(input, { target: { value: '1' } });

      const sendBtn = screen.getByTitle('Send');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.getByText(/Active Campus & Pooled Drives/)).toBeInTheDocument();
      });
      expect(screen.getByText(/Associate Cloud Engineer/)).toBeInTheDocument();
    });

    it('handles quick action chips and outputs applications status for "APPLICATIONS"', async () => {
      render(<WhatsAppAssistantPreview isLiveConfigured={false} />);

      const appChip = screen.getByRole('button', { name: '2. Applications' });
      fireEvent.click(appChip);

      await waitFor(() => {
        expect(screen.getByText(/Your Application Status Tracker/)).toBeInTheDocument();
      });
      expect(screen.getByText(/Rural FinTech Systems/)).toBeInTheDocument();
    });

    it('simulates AI Career Guidance for "6" or "GUIDANCE"', async () => {
      render(<WhatsAppAssistantPreview isLiveConfigured={false} />);

      const input = screen.getByPlaceholderText('Type a command or message...');
      fireEvent.change(input, { target: { value: 'GUIDANCE' } });

      const sendBtn = screen.getByTitle('Send');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.getByText(/CareerBridge AI Career Guidance/)).toBeInTheDocument();
      });
      expect(screen.getByText(/High-Placement Roles in Demand/)).toBeInTheDocument();
    });

    it('simulates STOP command and confirms opt-out', async () => {
      render(<WhatsAppAssistantPreview isLiveConfigured={false} />);

      const input = screen.getByPlaceholderText('Type a command or message...');
      fireEvent.change(input, { target: { value: 'STOP' } });

      const sendBtn = screen.getByTitle('Send');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(screen.getByText(/You have successfully unsubscribed/)).toBeInTheDocument();
      });
    });
  });

  describe('AdminWhatsAppControlCard — Governance, Analytics & Webhook Health', () => {
    const mockAdminStatus: WhatsAppIntegrationStatusReport = {
      isConfigured: true,
      apiVersion: 'v21.0',
      phoneNumberId: 'phone-id-12345',
      businessAccountId: 'biz-acc-98765',
      hasAccessToken: true,
      hasAppSecret: true,
      hasVerifyToken: true,
      webhookUrl: 'https://careerbridge.bharat.gov.in/api/whatsapp/webhook',
    };

    const mockAdminAnalytics: WhatsAppAdminAnalytics = {
      totalLinkedStudents: 48,
      totalVerifiedAccounts: 45,
      totalOptedOut: 3,
      totalInboundMessages: 320,
      totalOutboundMessages: 295,
      totalDeliveredMessages: 290,
      totalFailedMessages: 5,
      deliverySuccessRate: 98.3,
      messagesToday: 42,
      activeConversations24h: 38,
      categoryStats: {
        jobAlertsSubscribed: 45,
        applicationUpdatesSubscribed: 47,
        interviewAlertsSubscribed: 46,
        careerTipsSubscribed: 28,
      },
    };

    const mockWebhookEvents: WhatsAppWebhookEventData[] = [
      {
        id: 'evt-1',
        metaMessageId: 'wamid.HBgLMTIzNDU2Nzg5MA==',
        senderPhone: '+91 98765 00001',
        eventType: 'INBOUND_MESSAGE',
        payloadPreview: 'JOBS',
        processingStatus: 'PROCESSED',
        timestamp: '2026-10-30T10:15:00.000Z',
      },
      {
        id: 'evt-2',
        metaMessageId: 'wamid.HBgLMTIzNDU2Nzg5MQ==',
        senderPhone: '+91 98765 00002',
        eventType: 'DELIVERY_STATUS_UPDATE',
        payloadPreview: 'status: delivered',
        processingStatus: 'PROCESSED',
        timestamp: '2026-10-30T10:16:00.000Z',
      },
    ];

    it('renders admin status report with configuration parameters and live badge', async () => {
      vi.mocked(api.fetchWhatsAppAdminStatusApi).mockResolvedValueOnce({
        success: true,
        data: mockAdminStatus,
      });
      vi.mocked(api.fetchWhatsAppAdminAnalyticsApi).mockResolvedValueOnce({
        success: true,
        data: mockAdminAnalytics,
      });
      vi.mocked(api.fetchWhatsAppAdminEventsApi).mockResolvedValueOnce({
        success: true,
        data: mockWebhookEvents,
      });

      render(<AdminWhatsAppControlCard token="admin-jwt" />);

      expect(await screen.findByText('WhatsApp Integration & Bot Control')).toBeInTheDocument();
      expect(screen.getByText('Cloud API Configured')).toBeInTheDocument();
      expect(screen.getByText('https://careerbridge.bharat.gov.in/api/whatsapp/webhook')).toBeInTheDocument();
      expect(screen.getByText('v21.0')).toBeInTheDocument();
    });

    it('renders real analytics figures from database aggregation', async () => {
      vi.mocked(api.fetchWhatsAppAdminStatusApi).mockResolvedValueOnce({
        success: true,
        data: mockAdminStatus,
      });
      vi.mocked(api.fetchWhatsAppAdminAnalyticsApi).mockResolvedValueOnce({
        success: true,
        data: mockAdminAnalytics,
      });
      vi.mocked(api.fetchWhatsAppAdminEventsApi).mockResolvedValueOnce({
        success: true,
        data: mockWebhookEvents,
      });

      render(<AdminWhatsAppControlCard token="admin-jwt" />);

      expect(await screen.findByText('48')).toBeInTheDocument(); // totalLinkedStudents
      expect(screen.getByText('98.3%')).toBeInTheDocument(); // deliverySuccessRate
      expect(screen.getByText('320')).toBeInTheDocument(); // totalInboundMessages
      expect(screen.getByText('295')).toBeInTheDocument(); // totalOutboundMessages
    });

    it('renders recent webhook events table with statuses and payloads', async () => {
      vi.mocked(api.fetchWhatsAppAdminStatusApi).mockResolvedValueOnce({
        success: true,
        data: mockAdminStatus,
      });
      vi.mocked(api.fetchWhatsAppAdminAnalyticsApi).mockResolvedValueOnce({
        success: true,
        data: mockAdminAnalytics,
      });
      vi.mocked(api.fetchWhatsAppAdminEventsApi).mockResolvedValueOnce({
        success: true,
        data: mockWebhookEvents,
      });

      render(<AdminWhatsAppControlCard token="admin-jwt" />);

      expect(await screen.findByText('Recent Meta Webhook Events')).toBeInTheDocument();
      expect(screen.getByText('INBOUND_MESSAGE')).toBeInTheDocument();
      expect(screen.getByText('DELIVERY_STATUS_UPDATE')).toBeInTheDocument();
      expect(screen.getByText('+91 98765 00001')).toBeInTheDocument();
    });

    it('dispatches diagnostic test message from admin console', async () => {
      vi.mocked(api.fetchWhatsAppAdminStatusApi).mockResolvedValueOnce({
        success: true,
        data: mockAdminStatus,
      });
      vi.mocked(api.fetchWhatsAppAdminAnalyticsApi).mockResolvedValueOnce({
        success: true,
        data: mockAdminAnalytics,
      });
      vi.mocked(api.fetchWhatsAppAdminEventsApi).mockResolvedValueOnce({
        success: true,
        data: mockWebhookEvents,
      });
      vi.mocked(api.sendWhatsAppTestMessageApi).mockResolvedValueOnce({
        success: true,
        data: {
          success: true,
          metaMessageId: 'wamid.HBgLMTIzNDU2Nzg5Mw==',
          deliveryStatus: 'SENT',
          message: 'Diagnostic test message sent successfully.',
        },
      });

      render(<AdminWhatsAppControlCard token="admin-jwt" />);

      const phoneInput = await screen.findByPlaceholderText('+91 98765 43210');
      fireEvent.change(phoneInput, { target: { value: '9876543210' } });

      const sendBtn = screen.getByText('Send Diagnostic Message');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(api.sendWhatsAppTestMessageApi).toHaveBeenCalledWith(
          expect.objectContaining({
            recipientPhone: '9876543210',
          }),
          'admin-jwt'
        );
      });
    });
  });
});
