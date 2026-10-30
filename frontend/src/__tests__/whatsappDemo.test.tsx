import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';
import { WhatsAppDemoAssistant } from '../components/whatsapp/WhatsAppDemoAssistant';
import { WhatsAppAssistantPreview } from '../components/whatsapp/WhatsAppAssistantPreview';
import { WhatsAppIntegrationCard } from '../components/whatsapp/WhatsAppIntegrationCard';
import {
  findBestAnswer,
  DEMO_HONEST_FALLBACK,
  DEMO_KNOWLEDGE_TOPICS,
  DEMO_SUGGESTED_QUESTIONS,
  DEMO_SIMULATED_NOTIFICATIONS,
} from '../components/whatsapp/demoKnowledgeBase';
import * as api from '../services/api';

// Mock the API module to verify real WhatsApp integration stays intact
vi.mock('../services/api', () => ({
  fetchWhatsAppStatusApi: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: {
        linked: false,
        integrationConfigured: true,
        officialNumber: '918001122334',
      },
    })
  ),
  requestWhatsAppLinkCodeApi: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: {
        code: 'CB-9941',
        expiresInSeconds: 300,
        expiresAt: new Date(Date.now() + 300000).toISOString(),
        officialPhoneNumber: '+91 80011 22334',
        instruction: 'Send code to verify',
      },
    })
  ),
  verifyWhatsAppLinkCodeApi: vi.fn(),
  unlinkWhatsAppAccountApi: vi.fn(),
  updateWhatsAppPreferencesApi: vi.fn(),
}));

describe('CareerBridge WhatsApp Demo Mode Suite (MISSION BHARAT Challenge #07)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 1. KNOWLEDGE BASE & INTENT ENGINE UNIT TESTS
  // ==========================================
  describe('Local Structured Knowledge Base (demoKnowledgeBase.ts)', () => {
    it('covers all 14 verified topics accurately', () => {
      expect(DEMO_KNOWLEDGE_TOPICS.length).toBe(14);

      const topicIds = DEMO_KNOWLEDGE_TOPICS.map((t) => t.id);
      expect(topicIds).toContain('what-is-careerbridge');
      expect(topicIds).toContain('student-profile');
      expect(topicIds).toContain('student-dashboard');
      expect(topicIds).toContain('career-readiness');
      expect(topicIds).toContain('skills-improvement');
      expect(topicIds).toContain('job-discovery');
      expect(topicIds).toContain('explainable-job-matching');
      expect(topicIds).toContain('application-tracking');
      expect(topicIds).toContain('learning-hub');
      expect(topicIds).toContain('mentorship');
      expect(topicIds).toContain('college-dashboard');
      expect(topicIds).toContain('employer-dashboard');
      expect(topicIds).toContain('interviews-updates');
      expect(topicIds).toContain('platform-navigation');
    });

    it('contains the 8 exact suggested questions requested', () => {
      expect(DEMO_SUGGESTED_QUESTIONS.length).toBe(8);
      const questions = DEMO_SUGGESTED_QUESTIONS.map((q) => q.question);
      expect(questions).toContain('What is CareerBridge?');
      expect(questions).toContain('How can I create my student profile?');
      expect(questions).toContain('How can I check my career readiness?');
      expect(questions).toContain('How do I find suitable jobs?');
      expect(questions).toContain('How can I track my applications?');
      expect(questions).toContain('How can I improve my skills?');
      expect(questions).toContain('How can I connect with a mentor?');
      expect(questions).toContain('How can employers post jobs?');
    });

    it('contains the 5 simulated notification templates', () => {
      expect(DEMO_SIMULATED_NOTIFICATIONS.length).toBe(5);
      const types = DEMO_SIMULATED_NOTIFICATIONS.map((n) => n.type);
      expect(types).toContain('Job Alert');
      expect(types).toContain('Application Update');
      expect(types).toContain('Interview Reminder');
      expect(types).toContain('Career Readiness Tip');
      expect(types).toContain('Learning Recommendation');
    });

    it('responds correctly to MENU and command shortcuts', () => {
      const menuRes = findBestAnswer('MENU');
      expect(menuRes.reply).toContain('CareerBridge Assistant Menu');
      expect(menuRes.matchedTopicId).toBe('menu');

      const jobsRes = findBestAnswer('1');
      expect(jobsRes.reply).toContain('Job Discovery & Open Campus Drives');

      const readinessRes = findBestAnswer('READINESS');
      expect(readinessRes.reply).toContain('50 kbps Low-Bandwidth Career Readiness Report');
    });

    it('responds correctly to suggested questions', () => {
      const answer = findBestAnswer('What is CareerBridge?');
      expect(answer.reply).toContain('MISSION BHARAT Hackathon — Challenge #07');
      expect(answer.isFallback).toBeFalsy();
    });

    it('returns honest fallback for unsupported queries', () => {
      const unsupported = findBestAnswer('What is the weather in Delhi tomorrow?');
      expect(unsupported.reply).toBe(DEMO_HONEST_FALLBACK);
      expect(unsupported.isFallback).toBe(true);
    });
  });

  // ==========================================
  // 2. WHATSAPP DEMO ASSISTANT INTERACTION TESTS
  // ==========================================
  describe('WhatsAppDemoAssistant UI & Interactions', () => {
    it('renders chat header with CareerBridge Assistant, DEMO MODE badge, and welcome message', () => {
      render(<WhatsAppDemoAssistant onClose={vi.fn()} isModal={false} />);

      // Assistant title and DEMO MODE label
      expect(screen.getByText('CareerBridge Assistant')).toBeInTheDocument();
      expect(screen.getAllByText(/DEMO MODE/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Online Demo/i)).toBeInTheDocument();

      // Welcome message content
      expect(screen.getByText(/Welcome to CareerBridge Assistant!/i)).toBeInTheDocument();
      expect(screen.getByText(/MISSION BHARAT Hackathon/i)).toBeInTheDocument();

      // Suggested questions should be visible
      expect(screen.getByText('What is CareerBridge?')).toBeInTheDocument();
      expect(screen.getByText('How can I check career readiness?')).toBeInTheDocument();
    });

    it('clicking a suggested question adds the user message and assistant replies after typing delay', async () => {
      vi.useFakeTimers();

      render(<WhatsAppDemoAssistant onClose={vi.fn()} isModal={false} />);

      // Click "How can I check career readiness?"
      const suggestedBtn = screen.getByRole('button', { name: /How can I check career readiness\?/i });
      fireEvent.click(suggestedBtn);

      // User question should appear immediately
      expect(screen.getByText('How can I check career readiness?')).toBeInTheDocument();

      // Typing indicator should show
      expect(screen.getByText(/Assistant typing\.\.\./i)).toBeInTheDocument();

      // Fast forward typing timer (~750ms)
      act(() => {
        vi.advanceTimersByTime(800);
      });

      // Typing indicator should disappear and assistant response should be present
      expect(screen.queryByText(/Assistant typing\.\.\./i)).not.toBeInTheDocument();
      expect(screen.getByText(/50 kbps Low-Bandwidth Career Readiness Report/i)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('typing a custom question and pressing Enter sends message and receives response', async () => {
      vi.useFakeTimers();

      render(<WhatsAppDemoAssistant onClose={vi.fn()} isModal={false} />);

      const input = screen.getByLabelText(/Type message/i);
      fireEvent.change(input, { target: { value: 'tell me about voice profile creation' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // User message should appear
      expect(screen.getByText('tell me about voice profile creation')).toBeInTheDocument();

      // Advance timer for response
      act(() => {
        vi.advanceTimersByTime(800);
      });

      // Assistant responds with voice profile details (Tamil & Kannada)
      expect(screen.getByText(/Student Profile & Multilingual Voice Creation/i)).toBeInTheDocument();
      expect(screen.getByText(/Tamil \(தமிழ்\)/i)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('displays honest fallback when user asks an unsupported question', async () => {
      vi.useFakeTimers();

      render(<WhatsAppDemoAssistant onClose={vi.fn()} isModal={false} />);

      const input = screen.getByLabelText(/Type message/i);
      fireEvent.change(input, { target: { value: 'can you book me a flight ticket?' } });
      fireEvent.submit(input.closest('form')!);

      act(() => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getByText(DEMO_HONEST_FALLBACK)).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('clears conversation when confirmed', () => {
      render(<WhatsAppDemoAssistant onClose={vi.fn()} isModal={false} />);

      // Send a quick question
      const qBtn = screen.getByRole('button', { name: /What is CareerBridge\?/i });
      fireEvent.click(qBtn);

      // Click clear button
      const clearBtn = screen.getByTitle('Clear Conversation');
      fireEvent.click(clearBtn);

      // Confirmation modal appears
      expect(screen.getByText('Clear conversation?')).toBeInTheDocument();

      // Confirm clear
      const confirmClear = screen.getByRole('button', { name: /^Clear Chat$/i });
      fireEvent.click(confirmClear);

      // Should reset back to 1 message (initial welcome message)
      expect(screen.queryByText('Clear conversation?')).not.toBeInTheDocument();
      expect(screen.getByText(/Welcome to CareerBridge Assistant!/i)).toBeInTheDocument();
    });
  });

  // ==========================================
  // 3. NOTIFICATION PREVIEW TESTS
  // ==========================================
  describe('Notification Preview Studio', () => {
    it('switches to Notification Previews tab and displays 5 sample notification cards with SIMULATED badges', () => {
      render(<WhatsAppDemoAssistant onClose={vi.fn()} isModal={false} />);

      // Click "Notification Previews" tab in header
      const notifTab = screen.getByRole('button', { name: /Notification Previews/i });
      fireEvent.click(notifTab);

      // Verify header and simulation notice
      expect(screen.getByText(/Sample Placement Notification Templates/i)).toBeInTheDocument();
      expect(screen.getByText(/5 Types Available/i)).toBeInTheDocument();

      // Verify all 5 simulated cards exist
      expect(screen.getByText('New Campus Drive: Junior Cloud Engineer')).toBeInTheDocument();
      expect(screen.getByText('Application Shortlisted: Frontend Developer Trainee')).toBeInTheDocument();
      expect(screen.getByText('Interview Reminder: Technical Round 1 Tomorrow')).toBeInTheDocument();
      expect(screen.getByText('Readiness Insight: Boost Your ATS Resume Score')).toBeInTheDocument();
      expect(screen.getByText('Sprint Recommendation: RESTful API Architecture')).toBeInTheDocument();

      // Verify SIMULATED badges
      expect(screen.getAllByText('SIMULATED').length).toBe(5);
    });

    it('clicking "Preview in Live Chat" inserts simulated notification into active chat stream', () => {
      render(<WhatsAppDemoAssistant onClose={vi.fn()} isModal={false} />);

      // Switch to notifications
      fireEvent.click(screen.getByRole('button', { name: /Notification Previews/i }));

      // Click "Preview in Live Chat" on the first notification (Junior Cloud Engineer)
      const previewBtns = screen.getAllByRole('button', { name: /Preview in Live Chat/i });
      fireEvent.click(previewBtns[0]);

      // Automatically switches back to Chat tab with the simulated message badge
      expect(screen.getByText(/SIMULATED Job Alert/i)).toBeInTheDocument();
      expect(screen.getByText(/NEW CAMPUS DRIVE ALERT/i)).toBeInTheDocument();
      expect(screen.getByText(/Bharat Cloud Tech/i)).toBeInTheDocument();
    });
  });

  // ==========================================
  // 4. SIMULATED ACCOUNT LINKING TESTS
  // ==========================================
  describe('Simulated Account Linking Sandbox', () => {
    it('displays simulated account status with SIMULATED ACCOUNT badge', () => {
      render(<WhatsAppDemoAssistant onClose={vi.fn()} isModal={false} />);

      // Switch to Simulated Linking tab
      const linkingTab = screen.getByRole('button', { name: /Simulated Linking/i });
      fireEvent.click(linkingTab);

      expect(screen.getByText(/SIMULATED ACCOUNT/i)).toBeInTheDocument();
      expect(screen.getByText('+919876543210')).toBeInTheDocument();
      expect(screen.getByText('Simulated Active')).toBeInTheDocument();
    });

    it('simulates unlinking and re-linking phone number without calling backend', async () => {
      vi.useFakeTimers();

      render(<WhatsAppDemoAssistant onClose={vi.fn()} isModal={false} />);

      // Open linking tab
      fireEvent.click(screen.getByRole('button', { name: /Simulated Linking/i }));

      // Click Simulate Unlink
      const unlinkBtn = screen.getByRole('button', { name: /Simulate Unlink/i });
      fireEvent.click(unlinkBtn);

      expect(screen.getByText('Simulated Unlinked')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/919876543210/i)).toBeInTheDocument();

      // Enter a new test number and simulate link
      const phoneInput = screen.getByPlaceholderText(/919876543210/i);
      fireEvent.change(phoneInput, { target: { value: '919123456789' } });

      const linkBtn = screen.getByRole('button', { name: /Simulate Link/i });
      fireEvent.click(linkBtn);

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(screen.getByText('+919123456789')).toBeInTheDocument();
      expect(screen.getByText('Simulated Active')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  // ==========================================
  // 5. BACKWARD COMPATIBILITY & REAL INTEGRATION TESTS
  // ==========================================
  describe('Backward Compatibility & Production Integration Integrity', () => {
    it('WhatsAppAssistantPreview wraps WhatsAppDemoAssistant correctly', () => {
      render(<WhatsAppAssistantPreview onClose={vi.fn()} />);

      expect(screen.getByText('CareerBridge Assistant')).toBeInTheDocument();
      expect(screen.getAllByText(/DEMO MODE/i).length).toBeGreaterThan(0);
    });

    it('WhatsAppIntegrationCard preserves real linking API and triggers demo preview', async () => {
      const onPreviewMock = vi.fn();

      render(<WhatsAppIntegrationCard token="test-token" onPreviewRequested={onPreviewMock} />);

      await waitFor(() => {
        expect(api.fetchWhatsAppStatusApi).toHaveBeenCalledWith('test-token');
      });

      // Launch Demo Mode button should be available
      const demoBtns = screen.getAllByRole('button', { name: /Launch Demo Mode|Launch WhatsApp Demo Mode/i });
      expect(demoBtns.length).toBeGreaterThan(0);

      fireEvent.click(demoBtns[0]);
      expect(onPreviewMock).toHaveBeenCalledTimes(1);

      // Real "Connect WhatsApp" button should also be available and operational
      const connectBtn = screen.getByRole('button', { name: /Connect WhatsApp/i });
      fireEvent.click(connectBtn);

      await waitFor(() => {
        expect(api.requestWhatsAppLinkCodeApi).toHaveBeenCalledWith('test-token');
      });
    });
  });
});
