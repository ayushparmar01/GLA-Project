import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminMetricsCards } from '../components/admin/AdminMetricsCards';
import { AdminUserManagementTable } from '../components/admin/AdminUserManagementTable';
import { AdminEmployerVerificationTable } from '../components/admin/AdminEmployerVerificationTable';
import { AdminCollegeManagementTable } from '../components/admin/AdminCollegeManagementTable';
import { AdminContentModerationTable } from '../components/admin/AdminContentModerationTable';
import { AdminAnalyticsCharts } from '../components/admin/AdminAnalyticsCharts';
import { AdminAuditLogsTable } from '../components/admin/AdminAuditLogsTable';
import { AdminSystemHealthCard } from '../components/admin/AdminSystemHealthCard';
import {
  AdminDashboardMetrics,
  SafeUser,
  EmployerCompanyProfileData,
  ModerationItemData,
  PlatformAnalyticsReport,
  AuditLogEntry,
  AdminSystemHealthReport,
} from '../types';

const mockMetrics: AdminDashboardMetrics = {
  totalUsers: 142,
  totalStudents: 110,
  totalEmployers: 22,
  totalColleges: 10,
  activeCohorts: 8,
  publishedOpportunities: 14,
  totalApplications: 96,
  activeCareerEvents: 4,
  pendingEmployerVerifications: 3,
  pendingCollegeVerifications: 2,
  recentActivities: [
    {
      id: 'act-1',
      actorId: 'admin-1',
      actorName: 'Admin System',
      actorRole: 'ADMIN',
      action: 'SUSPEND_USER',
      resourceType: 'USER',
      resourceId: 'usr-101',
      reason: 'Spam recruitment messages',
      timestamp: '2026-10-30T10:00:00.000Z',
    },
  ],
};

const mockUsers: SafeUser[] = [
  {
    id: 'user-1',
    fullName: 'Aarav Patel',
    email: 'aarav@district.edu.in',
    role: 'STUDENT',
    preferredLanguage: 'en',
    isActive: true,
    isSuspended: false,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'user-2',
    fullName: 'Bad Recruiter',
    email: 'scam@fakecorp.in',
    role: 'EMPLOYER',
    preferredLanguage: 'en',
    isActive: true,
    isSuspended: true,
    suspensionReason: 'Fee solicitation from job seekers',
    createdAt: '2026-10-05T10:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
  },
];

const mockPendingEmployer: EmployerCompanyProfileData = {
  id: 'emp-prof-1',
  userId: 'usr-emp-1',
  companyName: 'Bharat Cloud Tech',
  companyDescription: 'Enterprise cloud solutions provider expanding recruitment to rural colleges.',
  companyWebsite: 'https://bharatcloud.in',
  industry: 'Information Technology',
  companySize: '51-200',
  headquarters: 'Indore, MP',
  contactPerson: 'Vikram Joshi',
  designation: 'Head of Talent Acquisition',
  verified: false,
  verificationStatus: 'PENDING',
  createdAt: '2026-10-25T10:00:00.000Z',
  updatedAt: '2026-10-25T10:00:00.000Z',
};

const mockColleges = [
  {
    id: 'col-1',
    fullName: 'Government Polytechnic Ambikapur',
    email: 'placement@gpa.ac.in',
    role: 'COLLEGE' as const,
    preferredLanguage: 'en',
    isActive: true,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    collegeProfile: {
      institutionName: 'Government Polytechnic Ambikapur',
      institutionLocation: 'Ambikapur, Chhattisgarh',
      institutionType: 'Polytechnic Diploma',
      placementEmail: 'placement@gpa.ac.in',
      placementPhone: '07774-222333',
      verified: false,
    },
    stats: {
      cohortCount: 3,
      driveCount: 2,
    },
  },
];

const mockModerationItem: ModerationItemData = {
  id: 'mod-1',
  targetType: 'OPPORTUNITY',
  targetId: 'opp-101',
  targetTitle: 'Suspicious Software Trainee',
  reason: 'Requires security deposit before technical round interview',
  flaggedBy: 'usr-student-1',
  flaggedByName: 'Kavita Roy',
  status: 'PENDING',
  createdAt: '2026-10-30T09:30:00.000Z',
  updatedAt: '2026-10-30T09:30:00.000Z',
};

const mockAnalytics: PlatformAnalyticsReport = {
  userGrowth: [{ date: '2026-10-01', students: 50, employers: 5, colleges: 2 }],
  opportunityCategories: [
    { category: 'JOB', count: 10 },
    { category: 'INTERNSHIP', count: 4 },
  ],
  applicationFunnel: {
    applied: 96,
    shortlisted: 48,
    interviewScheduled: 24,
    selected: 12,
    rejected: 20,
    withdrawn: 4,
  },
  transparentPlacementOutcomes: {
    totalSelected: 12,
    offerConfirmed: 12,
    joined: 10,
    outcomeVerified: 9,
    note: 'All placement figures reflect actual database records. CareerBridge strictly prohibits fabricating employment metrics or counting unverified claims.',
  },
  topSkillsInDemand: [
    { skill: 'react', count: 12 },
    { skill: 'node.js', count: 10 },
  ],
};

const mockAuditLog: AuditLogEntry = {
  id: 'log-1',
  actorId: 'admin-1',
  actorRole: 'ADMIN',
  action: 'SUSPEND_USER',
  resourceType: 'USER',
  resourceId: 'usr-102',
  reason: 'Recruiter impersonation',
  timestamp: '2026-10-30T10:15:00.000Z',
};

const mockHealth: AdminSystemHealthReport = {
  server: {
    status: 'healthy',
    uptimeSeconds: 86400,
    memoryUsage: { heapUsedMB: 48.5, heapTotalMB: 75.2, rssMB: 110.4 },
    environment: 'production',
    nodeVersion: 'v20.18.0',
  },
  database: {
    status: 'connected',
    host: 'MongoDB Cluster',
    name: 'careerbridge-prod',
  },
  aiProvider: {
    configured: true,
    activeProvider: 'GEMINI',
    status: 'healthy',
  },
  notifications: {
    status: 'operational',
    activeSseClients: 15,
  },
  recentErrorCount: 0,
  sanitizedDiagnostics: [
    'Platform: linux (x64)',
    'Sensitive Environment Variables: [MASKED]',
    'API Keys: [MASKED]',
  ],
};

describe('Phase 9: Admin Control Centre, Analytics, Moderation & Governance Views', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. AdminMetricsCards Component', () => {
    it('should render platform metrics correctly from real data', () => {
      render(<AdminMetricsCards metrics={mockMetrics} loading={false} />);

      expect(screen.getByText('Total Registered Users')).toBeDefined();
      expect(screen.getByText('142')).toBeDefined();
      expect(screen.getByText('Active Cohorts')).toBeDefined();
      expect(screen.getByText('8')).toBeDefined();
      expect(screen.getByText('Published Drives')).toBeDefined();
      expect(screen.getByText('14')).toBeDefined();
      expect(screen.getByText('Pending Employers')).toBeDefined();
      expect(screen.getByText('3')).toBeDefined();
    });
  });

  describe('2. AdminUserManagementTable Component', () => {
    it('should list users with role and status indicators', () => {
      render(
        <AdminUserManagementTable
          users={mockUsers}
          totalUsers={2}
          currentPage={1}
          totalPages={1}
          currentUserId="admin-1"
          loading={false}
          onPageChange={vi.fn()}
          onFilterRole={vi.fn()}
          onFilterStatus={vi.fn()}
          onSearch={vi.fn()}
          onSuspendUser={vi.fn()}
          onReactivateUser={vi.fn()}
        />
      );

      expect(screen.getByText('Aarav Patel')).toBeDefined();
      expect(screen.getByText('aarav@district.edu.in')).toBeDefined();
      expect(screen.getByText('STUDENT')).toBeDefined();
      expect(screen.getByText('Bad Recruiter')).toBeDefined();
      expect(screen.getByText('Suspended')).toBeDefined();
      expect(screen.getByText(/Fee solicitation from job seekers/)).toBeDefined();
    });

    it('should open suspension modal and validate required reason', async () => {
      const suspendMock = vi.fn().mockResolvedValue(true);

      render(
        <AdminUserManagementTable
          users={mockUsers}
          totalUsers={2}
          currentPage={1}
          totalPages={1}
          currentUserId="admin-1"
          loading={false}
          onPageChange={vi.fn()}
          onFilterRole={vi.fn()}
          onFilterStatus={vi.fn()}
          onSearch={vi.fn()}
          onSuspendUser={suspendMock}
          onReactivateUser={vi.fn()}
        />
      );

      // Click suspend button on active user (Aarav Patel)
      const suspendBtn = screen.getByText('Suspend');
      fireEvent.click(suspendBtn);

      expect(screen.getByText('Suspend User Account')).toBeDefined();

      // Click confirm without reason -> should display validation error
      const confirmBtn = screen.getByText('Confirm Suspension');
      fireEvent.click(confirmBtn);

      expect(screen.getByText(/valid suspension reason is required/)).toBeDefined();
      expect(suspendMock).not.toHaveBeenCalled();

      // Enter reason and confirm
      const textarea = screen.getByPlaceholderText(/Specify the terms violation/);
      fireEvent.change(textarea, { target: { value: 'Abusive language in drive discussion' } });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(suspendMock).toHaveBeenCalledWith('user-1', 'Abusive language in drive discussion');
      });
    });

    it('should call reactivate user when reactivate button is clicked', () => {
      const reactivateMock = vi.fn().mockResolvedValue(true);
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <AdminUserManagementTable
          users={mockUsers}
          totalUsers={2}
          currentPage={1}
          totalPages={1}
          currentUserId="admin-1"
          loading={false}
          onPageChange={vi.fn()}
          onFilterRole={vi.fn()}
          onFilterStatus={vi.fn()}
          onSearch={vi.fn()}
          onSuspendUser={vi.fn()}
          onReactivateUser={reactivateMock}
        />
      );

      const reactivateBtn = screen.getByText('Reactivate');
      fireEvent.click(reactivateBtn);

      expect(reactivateMock).toHaveBeenCalledWith('user-2');
    });
  });

  describe('3. AdminEmployerVerificationTable Component', () => {
    it('should render pending employer details for review', () => {
      render(
        <AdminEmployerVerificationTable
          pendingEmployers={[mockPendingEmployer]}
          loading={false}
          onVerifyEmployer={vi.fn()}
          onRejectEmployer={vi.fn()}
        />
      );

      expect(screen.getByText('Bharat Cloud Tech')).toBeDefined();
      expect(screen.getByText('Information Technology')).toBeDefined();
      expect(screen.getByText(/Indore, MP/)).toBeDefined();
      expect(screen.getByText(/Vikram Joshi/)).toBeDefined();
      expect(screen.getByText('Approve')).toBeDefined();
      expect(screen.getByText('Reject')).toBeDefined();
    });

    it('should approve employer verification with optional notes', async () => {
      const verifyMock = vi.fn().mockResolvedValue(true);

      render(
        <AdminEmployerVerificationTable
          pendingEmployers={[mockPendingEmployer]}
          loading={false}
          onVerifyEmployer={verifyMock}
          onRejectEmployer={vi.fn()}
        />
      );

      const approveBtn = screen.getByText('Approve');
      fireEvent.click(approveBtn);

      const confirmBtn = screen.getByText('Confirm');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(verifyMock).toHaveBeenCalledWith('emp-prof-1', undefined);
      });
    });

    it('should require rejection reason when rejecting employer', async () => {
      const rejectMock = vi.fn().mockResolvedValue(true);

      render(
        <AdminEmployerVerificationTable
          pendingEmployers={[mockPendingEmployer]}
          loading={false}
          onVerifyEmployer={vi.fn()}
          onRejectEmployer={rejectMock}
        />
      );

      const rejectBtn = screen.getByText('Reject');
      fireEvent.click(rejectBtn);

      expect(screen.getByText('Reject Employer Verification')).toBeDefined();

      const textarea = screen.getByPlaceholderText(/Incomplete tax registration/);
      fireEvent.change(textarea, { target: { value: 'Company registration number cannot be verified' } });

      const confirmRejectBtn = screen.getByText('Confirm Rejection');
      fireEvent.click(confirmRejectBtn);

      await waitFor(() => {
        expect(rejectMock).toHaveBeenCalledWith('emp-prof-1', 'Company registration number cannot be verified');
      });
    });
  });

  describe('4. AdminCollegeManagementTable Component', () => {
    it('should display registered colleges and allow institutional verification', async () => {
      const verifyCollegeMock = vi.fn().mockResolvedValue(true);

      render(
        <AdminCollegeManagementTable
          colleges={mockColleges}
          loading={false}
          onVerifyCollege={verifyCollegeMock}
        />
      );

      expect(screen.getByText('Government Polytechnic Ambikapur')).toBeDefined();
      expect(screen.getByText(/3 Student Cohorts/)).toBeDefined();
      expect(screen.getByText(/2 Drives Hosted/)).toBeDefined();

      const verifyBtn = screen.getByText('Verify College');
      fireEvent.click(verifyBtn);

      await waitFor(() => {
        expect(verifyCollegeMock).toHaveBeenCalledWith('col-1');
      });
    });
  });

  describe('5. AdminContentModerationTable Component', () => {
    it('should display flagged moderation item and resolve it', async () => {
      const reviewMock = vi.fn().mockResolvedValue(true);

      render(
        <AdminContentModerationTable
          items={[mockModerationItem]}
          loading={false}
          onReviewItem={reviewMock}
        />
      );

      expect(screen.getByText(/Suspicious Software Trainee/)).toBeDefined();
      expect(screen.getByText(/Requires security deposit/)).toBeDefined();
      expect(screen.getByText('Pending Review')).toBeDefined();

      const reviewBtn = screen.getByText('Review & Resolve');
      fireEvent.click(reviewBtn);

      const actionBtn = screen.getByText('Take Action / Remove');
      fireEvent.click(actionBtn);

      await waitFor(() => {
        expect(reviewMock).toHaveBeenCalledWith('mod-1', 'ACTION_TAKEN', undefined);
      });
    });
  });

  describe('6. AdminAnalyticsCharts Component', () => {
    it('should render application funnel and ethical transparency standards', () => {
      render(<AdminAnalyticsCharts analytics={mockAnalytics} loading={false} />);

      expect(screen.getByText(/Ethical & Transparent Placement Reporting/)).toBeDefined();
      expect(screen.getByText(/All placement figures reflect actual database records/)).toBeDefined();
      expect(screen.getByText('Recruitment Funnel Conversion')).toBeDefined();
      expect(screen.getByText('Applications Submitted')).toBeDefined();
      expect(screen.getByText('Selected for Placement')).toBeDefined();
      expect(screen.getByText('Top In-Demand Skills from Employers')).toBeDefined();
      expect(screen.getByText('react')).toBeDefined();
      expect(screen.getByText('node.js')).toBeDefined();
    });
  });

  describe('7. AdminAuditLogsTable & System Health Component', () => {
    it('should render immutable audit logs with actor and timestamp', () => {
      render(
        <AdminAuditLogsTable
          logs={[mockAuditLog]}
          totalLogs={1}
          currentPage={1}
          totalPages={1}
          loading={false}
          onPageChange={vi.fn()}
          onFilterAction={vi.fn()}
          onFilterResourceType={vi.fn()}
        />
      );

      expect(screen.getByText('Tamper-Resistant Audit Trail')).toBeDefined();
      expect(screen.getByText('SUSPEND_USER')).toBeDefined();
      expect(screen.getByText('Recruiter impersonation')).toBeDefined();
    });

    it('should render operational system health diagnostics safely without leaks', () => {
      render(
        <AdminSystemHealthCard
          health={mockHealth}
          loading={false}
          onRefresh={vi.fn()}
        />
      );

      expect(screen.getByText('Operational Diagnostics & Health Monitor')).toBeDefined();
      expect(screen.getByText(/Express Backend/)).toBeDefined();
      expect(screen.getByText('MongoDB Database')).toBeDefined();
      expect(screen.getByText('GEMINI')).toBeDefined();
      expect(screen.getByText(/15 Active Clients/)).toBeDefined();
      expect(screen.getByText(/Sanitized Diagnostics \(Strict Privacy\)/)).toBeDefined();
    });
  });
});
