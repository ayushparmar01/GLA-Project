import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { VoiceProfileModal } from '../components/student/VoiceProfileModal';
import { CareerReadinessView } from '../components/student/CareerReadinessView';
import { RecommendedOpportunitiesView } from '../components/student/RecommendedOpportunitiesView';
import { QuickJobPostModal } from '../components/employer/QuickJobPostModal';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  extractVoiceProfileApi: vi.fn(),
  fetchCareerReadinessReportApi: vi.fn(),
  fetchRecommendedJobsApi: vi.fn(),
  refreshRecommendationsApi: vi.fn(),
  createEmployerOpportunityApi: vi.fn(),
  publishEmployerOpportunityApi: vi.fn(),
}));

describe('Mission Bharat Hackathon Acceptance Criteria - Frontend Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // ==========================================
  // FEATURE 1: MULTILINGUAL VOICE PROFILE MODAL
  // ==========================================
  describe('Feature 1: Multilingual Voice Profile Creation (Tamil & Kannada)', () => {
    it('renders language selection including Tamil (ta-IN) and Kannada (kn-IN)', () => {
      render(
        <VoiceProfileModal
          isOpen={true}
          onClose={vi.fn()}
          onApplyProfile={vi.fn()}
          token="test-token"
        />
      );

      // Verify regional language chips are present
      expect(screen.getByText(/தமிழ்/i)).toBeInTheDocument();
      expect(screen.getByText(/ಕನ್ನಡ/i)).toBeInTheDocument();
      expect(screen.getByText(/हिन्दी/i)).toBeInTheDocument();
      expect(screen.getByText(/English/i)).toBeInTheDocument();

      // Verify 5-minute timer prompt
      expect(screen.getByText(/5-Minute Fast Track/i)).toBeInTheDocument();
    });

    it('loads sample Tamil speech transcript and extracts fields into review form', async () => {
      const mockExtractionResult = {
        success: true,
        data: {
          transcript: 'என் பெயர் விஜய். நான் அரசு பாலிடெக்னிக் கல்லூரியில் டிப்ளமோ எலக்ட்ரிக்கல் முடித்துள்ளேன்.',
          extractedProfile: {
            detectedLanguage: 'ta',
            fullName: 'விஜய்',
            degree: 'Diploma',
            specialization: 'Electrical Engineering',
            skills: ['Electrical Maintenance', 'Wiring & Circuit Installation'],
            preferredWorkLocation: ['Chennai', 'Coimbatore'],
            preferredJobRoles: ['Field Technician'],
            expectedStipend: '₹15,000/month',
            confidenceScore: 0.9,
          },
        },
      };

      vi.mocked(api.extractVoiceProfileApi).mockResolvedValueOnce(mockExtractionResult as any);

      render(
        <VoiceProfileModal
          isOpen={true}
          onClose={vi.fn()}
          onApplyProfile={vi.fn()}
          token="test-token"
        />
      );

      // Click "Load sample speech"
      const sampleBtn = screen.getByRole('button', { name: /Load sample speech/i });
      fireEvent.click(sampleBtn);

      // Click "Extract Profile with AI"
      const extractBtn = screen.getByRole('button', { name: /Extract Profile with AI/i });
      fireEvent.click(extractBtn);

      await waitFor(() => {
        expect(api.extractVoiceProfileApi).toHaveBeenCalledWith(
          expect.stringContaining('விஜய்'),
          'ta',
          'test-token'
        );
      });

      // Confirm step 2 (Review & Edit Form) renders with extracted values
      await waitFor(() => {
        expect(screen.getByText(/Review & Confirm Profile/i)).toBeInTheDocument();
        expect(screen.getByDisplayValue('விஜய்')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Diploma')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Electrical Engineering')).toBeInTheDocument();
        expect(screen.getByText('Electrical Maintenance')).toBeInTheDocument();
        expect(screen.getByText('Wiring & Circuit Installation')).toBeInTheDocument();
      });
    });

    it('submits reviewed profile back to student application', async () => {
      const mockApply = vi.fn().mockResolvedValue(undefined);
      const mockExtractionResult = {
        success: true,
        data: {
          transcript: 'English speech sample',
          extractedProfile: {
            detectedLanguage: 'en',
            fullName: 'Praveen Rao',
            degree: 'Diploma',
            specialization: 'Electrical Engineering',
            skills: ['Wiring & Circuit Installation'],
            preferredWorkLocation: ['Bengaluru'],
            preferredJobRoles: ['Maintenance Engineer'],
            confidenceScore: 0.85,
          },
        },
      };

      vi.mocked(api.extractVoiceProfileApi).mockResolvedValueOnce(mockExtractionResult as any);

      render(
        <VoiceProfileModal
          isOpen={true}
          onClose={vi.fn()}
          onApplyProfile={mockApply}
          token="test-token"
        />
      );

      // Switch to English and trigger extraction
      const enBtn = screen.getByText(/English/i);
      fireEvent.click(enBtn);

      const sampleBtn = screen.getByRole('button', { name: /Load sample speech/i });
      fireEvent.click(sampleBtn);

      const extractBtn = screen.getByRole('button', { name: /Extract Profile with AI/i });
      fireEvent.click(extractBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Confirm & Save to Profile/i })).toBeInTheDocument();
      });

      const confirmBtn = screen.getByRole('button', { name: /Confirm & Save to Profile/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockApply).toHaveBeenCalledWith(
          expect.objectContaining({
            fullName: 'Praveen Rao',
            skills: expect.arrayContaining(['Wiring & Circuit Installation']),
          })
        );
      });
    });
  });

  // ==========================================
  // FEATURE 2: 50 KBPS LOW-BANDWIDTH READINESS CHECK
  // ==========================================
  describe('Feature 2: Low-Bandwidth Readiness Check (50 kbps)', () => {
    const mockReportData = {
      overallScore: 78,
      statusBand: 'JOB_READY' as const,
      factors: [
        {
          name: 'Academic & Education Records',
          category: 'Education',
          weight: 15,
          score: 15,
          maxScore: 15,
          status: 'EXCELLENT' as const,
          details: 'Academic records recorded.',
        },
        {
          name: 'ATS Resume Availability',
          category: 'Resume',
          weight: 10,
          score: 10,
          maxScore: 10,
          status: 'EXCELLENT' as const,
          details: 'Active ATS-friendly resume compiled.',
        },
      ],
      missingFactors: [],
      improvementSuggestions: ['Complete mock technical interview'],
      assessmentVerifiedSkillsCount: 2,
      disclaimer: 'Career Readiness Score is an automated heuristic metric.',
      calculatedAt: '2026-10-30T18:00:00.000Z',
      isCompact: true,
    };

    it('fetches and caches readiness report with low-bandwidth mode support', async () => {
      vi.mocked(api.fetchCareerReadinessReportApi).mockResolvedValueOnce({
        success: true,
        data: mockReportData as any,
      });

      render(<CareerReadinessView token="test-token" />);

      // Should display low-bandwidth indicator toggle
      expect(screen.getByText(/50 kbps Low-Bandwidth/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(api.fetchCareerReadinessReportApi).toHaveBeenCalledWith('test-token', expect.any(Boolean));
        expect(screen.getByText('78%')).toBeInTheDocument();
        expect(screen.getByText(/JOB READY/i)).toBeInTheDocument();
      });

      // Verify cached in localStorage for offline resilience
      const cached = localStorage.getItem('careerbridge_readiness_cache');
      expect(cached).toBeTruthy();
      expect(JSON.parse(cached!).overallScore).toBe(78);
    });

    it('loads instantly from localStorage cache without network wait when available', () => {
      localStorage.setItem('careerbridge_readiness_cache', JSON.stringify(mockReportData));

      // Make API return delayed promise
      vi.mocked(api.fetchCareerReadinessReportApi).mockReturnValue(new Promise(() => {}));

      render(<CareerReadinessView token="test-token" />);

      // Instant rendering from cache
      expect(screen.getByText('78%')).toBeInTheDocument();
      expect(screen.getByText(/Displaying cached result/i)).toBeInTheDocument();
    });
  });

  // ==========================================
  // FEATURE 3: EXPLAINABLE JOB MATCHING
  // ==========================================
  describe('Feature 3: Explainable Job Matching', () => {
    const mockRecommendations = [
      {
        jobId: 'drive-101',
        drive: {
          _id: 'drive-101',
          title: 'Electrical Maintenance Technician',
          minimumQualification: 'Diploma in Electrical Engineering',
          location: 'Kolhapur, Maharashtra',
          salaryRange: '₹15,000 - ₹20,000 / month',
          company: { name: 'Kirloskar Electric Co.' },
          workMode: 'ONSITE',
          requiredSkills: ['Electrical Maintenance', 'Wiring & Circuit Installation'],
        },
        matchScore: 88,
        matchCategory: 'EXCELLENT_MATCH' as const,
        eligibilityStatus: 'ELIGIBLE' as const,
        explanation: {
          summary: '88% match for your Diploma in Electrical Engineering',
          checklist: [
            '✓ Diploma in Electrical Engineering matches the requirement.',
            '✓ Job location is within your preferred 30 km range (Kolhapur).',
            '✓ Employer has listed a stipend / salary (₹15,000 - ₹20,000 / month).',
            '✓ Your electrical maintenance skill matches the job description.',
            '✓ Suitable for freshers with no prior industry experience required.',
          ],
          matchingSkills: ['Electrical Maintenance', 'Wiring & Circuit Installation'],
          missingSkills: [],
          scoreBreakdown: {
            skillMatch: 90,
            academicMatch: 95,
            locationMatch: 90,
            salaryMatch: 80,
            overall: 88,
          },
        },
      },
    ];

    it('renders the explicit "Why this job matches you" checklist with checkmarks and honest criteria', async () => {
      vi.mocked(api.fetchRecommendedJobsApi).mockResolvedValueOnce({
        success: true,
        data: {
          recommendations: mockRecommendations as any,
          totalCount: 1,
          readinessScore: 78,
          cached: false,
          generatedAt: new Date().toISOString(),
        },
      });

      render(<RecommendedOpportunitiesView token="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Electrical Maintenance Technician')).toBeInTheDocument();
      });

      // Verify "Why this job matches you" checklist header
      expect(screen.getByText(/Why this job matches you:/i)).toBeInTheDocument();

      // Verify specific explainable checklist criteria
      expect(
        screen.getByText(/✓ Diploma in Electrical Engineering matches the requirement\./i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/✓ Job location is within your preferred 30 km range \(Kolhapur\)\./i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/✓ Employer has listed a stipend \/ salary/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/✓ Your electrical maintenance skill matches the job description\./i)
      ).toBeInTheDocument();
    });
  });

  // ==========================================
  // FEATURE 4: EMPLOYER JOB POSTING IN UNDER 3 MINUTES
  // ==========================================
  describe('Feature 4: Employer Job Posting in Under 3 Minutes', () => {
    it('renders fast-track modal with 3-minute completion timer and quick-fill chips', () => {
      render(
        <QuickJobPostModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          token="test-token"
          employerCompanyName="Bharat Dynamics"
        />
      );

      // Verify fast-track indicators and timer
      expect(screen.getByText(/Fast-Track Job Post/i)).toBeInTheDocument();
      expect(screen.getByText(/Target: < 3 mins/i)).toBeInTheDocument();

      // Verify popular title chips
      expect(screen.getByText('Junior Electrical Technician')).toBeInTheDocument();
      expect(screen.getByText('Associate Software Engineer')).toBeInTheDocument();

      // Verify quick skill chips
      expect(screen.getByText('Electrical Maintenance')).toBeInTheDocument();
      expect(screen.getByText('Wiring & Circuit Installation')).toBeInTheDocument();
    });

    it('auto-saves form inputs to localStorage draft and populates title from quick chips', () => {
      render(
        <QuickJobPostModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={vi.fn()}
          token="test-token"
          employerCompanyName="Bharat Dynamics"
        />
      );

      // Click title chip
      const titleChip = screen.getByText('Junior Electrical Technician');
      fireEvent.click(titleChip);

      // Verify title input updated
      const titleInput = screen.getByDisplayValue('Junior Electrical Technician');
      expect(titleInput).toBeInTheDocument();

      // Verify draft autosave in localStorage
      const savedDraft = localStorage.getItem('careerbridge_quick_job_draft');
      expect(savedDraft).toBeTruthy();
      expect(JSON.parse(savedDraft!).title).toBe('Junior Electrical Technician');
    });

    it('transitions to Candidate Preview step and allows one-click publish', async () => {
      vi.mocked(api.createEmployerOpportunityApi).mockResolvedValueOnce({
        success: true,
        data: { _id: 'drive-999', title: 'Junior Electrical Technician' } as any,
      });
      vi.mocked(api.publishEmployerOpportunityApi).mockResolvedValueOnce({
        success: true,
        data: { _id: 'drive-999', isPublished: true } as any,
      });

      const mockSuccess = vi.fn();

      render(
        <QuickJobPostModal
          isOpen={true}
          onClose={vi.fn()}
          onSuccess={mockSuccess}
          token="test-token"
          employerCompanyName="Bharat Dynamics"
        />
      );

      // Select title chip
      fireEvent.click(screen.getByText('Junior Electrical Technician'));

      // Click "Preview Job Post" button
      const previewBtn = screen.getByRole('button', { name: /Preview Job Post/i });
      fireEvent.click(previewBtn);

      // Verify Candidate Preview screen is visible
      expect(screen.getByText(/Candidate Preview Mode/i)).toBeInTheDocument();
      expect(screen.getByText(/One-Click Publish/i)).toBeInTheDocument();

      // Click "One-Click Publish"
      const publishBtn = screen.getByRole('button', { name: /One-Click Publish/i });
      fireEvent.click(publishBtn);

      await waitFor(() => {
        expect(api.createEmployerOpportunityApi).toHaveBeenCalled();
        expect(api.publishEmployerOpportunityApi).toHaveBeenCalledWith('drive-999', 'test-token');
        expect(mockSuccess).toHaveBeenCalled();
      });
    });
  });
});
