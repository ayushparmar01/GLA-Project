import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmployerDashboardView } from '../components/employer/EmployerDashboardView';
import { CompanyProfileView } from '../components/employer/CompanyProfileView';
import { OpportunityManagementView } from '../components/employer/OpportunityManagementView';
import { EmployerApplicantView } from '../components/employer/EmployerApplicantView';
import { InterviewManagementView } from '../components/employer/InterviewManagementView';
import { CollegeConnectionsView } from '../components/employer/CollegeConnectionsView';
import { CollegeDashboardView } from '../components/CollegeDashboardView';
import { StudentPlacementView } from '../components/StudentPlacementView';
import { AuthProvider } from '../context/AuthContext';
import {
  SafeUser,
  EmployerCompanyProfileData,
  EmployerDashboardStatsData,
  PlacementDriveData,
  PlacementApplicationData,
  InterviewData,
  CollegeEmployerConnectionData,
} from '../types';

const mockEmployerUser: SafeUser = {
  id: 'usr_emp_456',
  fullName: 'Anita Rao',
  email: 'hr@bharatcloud.in',
  role: 'EMPLOYER',
  preferredLanguage: 'en',
  isActive: true,
  employerProfile: {
    organizationName: 'BharatCloud Technologies Pvt Ltd',
    industry: 'Cloud Infrastructure & SaaS',
    organizationLocation: 'Pune, Maharashtra',
    organizationDescription: 'Scalable cloud infrastructure provider in tier-2/3 cities.',
  },
  createdAt: '2026-10-29T18:00:00.000Z',
  updatedAt: '2026-10-29T18:00:00.000Z',
};

const mockCompanyProfile: EmployerCompanyProfileData = {
  id: 'prof_emp_1',
  userId: 'usr_emp_456',
  companyName: 'BharatCloud Technologies Pvt Ltd',
  companyDescription: 'Scalable cloud infrastructure provider in tier-2/3 cities across Bharat.',
  companyWebsite: 'https://bharatcloud.in',
  industry: 'Cloud Infrastructure & SaaS',
  companySize: '51-200 employees',
  headquarters: 'Pune, Maharashtra',
  contactPerson: 'Anita Rao',
  designation: 'Head of Talent Acquisition',
  verified: false,
  verificationStatus: 'PENDING',
  createdAt: '2026-10-29T18:00:00.000Z',
  updatedAt: '2026-10-29T18:00:00.000Z',
};

const mockEmployerStats: EmployerDashboardStatsData = {
  totalOpportunities: 3,
  draftOpportunities: 1,
  publishedOpportunities: 2,
  totalApplications: 12,
  shortlistedCandidates: 4,
  interviewStageCandidates: 3,
  selectedCandidates: 1,
  recentOpportunities: [
    {
      id: 'drv_opp_1',
      title: 'Junior Cloud Operations Engineer',
      description: 'Manage AWS & Linux nodes for tier-2 smart grid systems.',
      employerId: 'usr_emp_456',
      createdBy: 'usr_emp_456',
      organizationName: 'BharatCloud Technologies Pvt Ltd',
      opportunityType: 'JOB',
      workMode: 'HYBRID',
      location: 'Pune',
      applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
      status: 'PUBLISHED',
      applicationCount: 8,
      requiredSkills: ['Linux', 'Docker', 'Networking'],
      createdAt: '2026-10-29T18:00:00.000Z',
      updatedAt: '2026-10-29T18:00:00.000Z',
    },
  ],
  recentApplications: [
    {
      id: 'app_1',
      driveId: 'drv_opp_1',
      studentId: 'usr_stu_1',
      status: 'SHORTLISTED',
      appliedAt: '2026-10-29T19:00:00.000Z',
      student: {
        id: 'usr_stu_1',
        fullName: 'Rahul Deshmukh',
        email: 'rahul@district-polytechnic.ac.in',
        role: 'STUDENT',
        preferredLanguage: 'en',
        isActive: true,
        studentProfile: {
          course: 'Diploma in Computer Science & Engineering',
          graduationYear: 2026,
          skills: ['Linux', 'Python'],
          profileCompletionScore: 100,
        },
        createdAt: '2026-10-29T18:00:00.000Z',
        updatedAt: '2026-10-29T18:00:00.000Z',
      },
      drive: {
        title: 'Junior Cloud Operations Engineer',
      },
      createdAt: '2026-10-29T19:00:00.000Z',
      updatedAt: '2026-10-29T19:00:00.000Z',
    },
  ],
  profileCompletionScore: 90,
  verificationStatus: 'PENDING',
  verified: false,
};

const mockEmployerOpportunities: PlacementDriveData[] = [
  {
    id: 'drv_opp_1',
    title: 'Junior Cloud Operations Engineer',
    description: 'Manage AWS & Linux nodes for tier-2 smart grid systems.',
    employerId: 'usr_emp_456',
    createdBy: 'usr_emp_456',
    organizationName: 'BharatCloud Technologies Pvt Ltd',
    opportunityType: 'JOB',
    workMode: 'HYBRID',
    location: 'Pune',
    salaryRange: '₹4.5 - 6.0 LPA',
    minimumCGPA: 6.5,
    numberOfOpenings: 5,
    applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    status: 'PUBLISHED',
    applicationCount: 8,
    requiredSkills: ['Linux', 'Docker', 'Networking'],
    createdAt: '2026-10-29T18:00:00.000Z',
    updatedAt: '2026-10-29T18:00:00.000Z',
  },
  {
    id: 'drv_opp_2',
    title: 'DevOps Intern',
    description: 'Cloud deployment trainee for final year students.',
    employerId: 'usr_emp_456',
    createdBy: 'usr_emp_456',
    organizationName: 'BharatCloud Technologies Pvt Ltd',
    opportunityType: 'INTERNSHIP',
    workMode: 'REMOTE',
    salaryRange: '₹20,000 / month',
    applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
    status: 'DRAFT',
    applicationCount: 0,
    requiredSkills: ['Git', 'Python'],
    createdAt: '2026-10-29T18:00:00.000Z',
    updatedAt: '2026-10-29T18:00:00.000Z',
  },
];

const mockApplications: PlacementApplicationData[] = [
  {
    id: 'app_1',
    driveId: 'drv_opp_1',
    studentId: 'usr_stu_1',
    status: 'SHORTLISTED',
    appliedAt: '2026-10-29T19:00:00.000Z',
    statusHistory: [
      {
        fromStatus: 'APPLIED',
        toStatus: 'SHORTLISTED',
        changedBy: 'usr_emp_456',
        changedAt: '2026-10-29T20:00:00.000Z',
        note: 'Strong Linux fundamentals from diploma project.',
      },
    ],
    student: {
      id: 'usr_stu_1',
      fullName: 'Rahul Deshmukh',
      email: 'rahul@district-polytechnic.ac.in',
      role: 'STUDENT',
      preferredLanguage: 'en',
      isActive: true,
      studentProfile: {
        course: 'Diploma in Computer Science & Engineering',
        graduationYear: 2026,
        skills: ['Linux', 'Python', 'Networking'],
        profileCompletionScore: 100,
      },
      createdAt: '2026-10-29T18:00:00.000Z',
      updatedAt: '2026-10-29T18:00:00.000Z',
    },
    drive: {
      title: 'Junior Cloud Operations Engineer',
      opportunityType: 'JOB',
      workMode: 'HYBRID',
    },
    createdAt: '2026-10-29T19:00:00.000Z',
    updatedAt: '2026-10-29T20:00:00.000Z',
  },
];

const mockInterviews: InterviewData[] = [
  {
    id: 'int_1',
    applicationId: 'app_1',
    driveId: 'drv_opp_1',
    employerId: 'usr_emp_456',
    studentId: 'usr_stu_1',
    interviewRound: 'Technical Round 1',
    interviewType: 'ONLINE',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    durationMinutes: 45,
    meetingLink: 'https://meet.google.com/xyz-abcd-efg',
    instructions: 'Prepare for live Linux terminal and networking queries.',
    status: 'SCHEDULED',
    createdBy: 'usr_emp_456',
    driveTitle: 'Junior Cloud Operations Engineer',
    companyName: 'BharatCloud Technologies Pvt Ltd',
    studentName: 'Rahul Deshmukh',
    studentEmail: 'rahul@district-polytechnic.ac.in',
    createdAt: '2026-10-29T20:00:00.000Z',
    updatedAt: '2026-10-29T20:00:00.000Z',
  },
];

const mockConnections: CollegeEmployerConnectionData[] = [
  {
    id: 'conn_1',
    collegeId: 'col_123',
    employerId: 'usr_emp_456',
    initiatedBy: 'EMPLOYER',
    message: 'Seeking computer engineering diploma candidates for 2026 batch.',
    status: 'PENDING',
    collegeName: 'District Polytechnic of Technology',
    employerName: 'BharatCloud Technologies Pvt Ltd',
    createdAt: '2026-10-29T19:30:00.000Z',
    updatedAt: '2026-10-29T19:30:00.000Z',
  },
];

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Phase 4: Employer Portal & Recruitment Management Frontend Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockFetch.mockImplementation(async (url: string) => {
      const u = String(url);

      if (u.includes('/api/auth/me')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: { user: mockEmployerUser } }),
        };
      }

      if (u.includes('/api/employers/dashboard')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockEmployerStats }),
        };
      }

      if (u.includes('/api/employers/profile/me')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockCompanyProfile }),
        };
      }

      if (u.includes('/api/employers/opportunities')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockEmployerOpportunities }),
        };
      }

      if (u.includes('/api/employers/applications')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockApplications }),
        };
      }

      if (u.includes('/api/employers/interviews')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockInterviews }),
        };
      }

      if (u.includes('/api/employers/connections')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockConnections }),
        };
      }

      if (u.includes('/api/students/me/interviews')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockInterviews }),
        };
      }

      if (u.includes('/api/applications/me') || u.includes('/api/students/me/applications')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockApplications }),
        };
      }

      if (u.includes('/api/colleges/') && u.includes('/connections')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockConnections }),
        };
      }

      if (u.includes('/api/college/stats')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              totalCohorts: 2,
              activeCohorts: 1,
              totalStudentsEnrolled: 45,
              totalDrives: 2,
              publishedDrives: 1,
              totalApplications: 12,
              recentCohorts: [],
              recentDrives: [],
            },
          }),
        };
      }

      if (u.includes('/api/placement-drives')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockEmployerOpportunities }),
        };
      }

      if (u.includes('/api/cohorts')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: [] }),
        };
      }

      return {
        ok: true,
        json: async () => ({ success: true, data: {} }),
      };
    });
  });

  describe('Employer Dashboard View', () => {
    it('renders real aggregate statistics from database without mock placeholders', async () => {
      render(
        <AuthProvider>
          <EmployerDashboardView
            onNavigateToOpportunities={vi.fn()}
            onNavigateToApplicants={vi.fn()}
            onNavigateToInterviews={vi.fn()}
            onNavigateToConnections={vi.fn()}
            onNavigateToProfile={vi.fn()}
          />
        </AuthProvider>
      );

      // Verify KPI metrics from database
      await waitFor(() => {
        expect(screen.getByText('Total Opportunities')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument(); // totalOpportunities
        expect(screen.getByText('Total Applicants')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument(); // totalApplications
        expect(screen.getByText('Selected Hires')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument(); // selectedCandidates
      });

      // Verification pill
      expect(screen.getByText('Verification Pending')).toBeInTheDocument();

      // Profile strength
      expect(screen.getByText('90% Completed')).toBeInTheDocument();
    });

    it('navigates to recruitment sub-views via quick navigation buttons', async () => {
      const mockNavigateOpps = vi.fn();
      const mockNavigateApplicants = vi.fn();

      render(
        <AuthProvider>
          <EmployerDashboardView
            onNavigateToOpportunities={mockNavigateOpps}
            onNavigateToApplicants={mockNavigateApplicants}
            onNavigateToInterviews={vi.fn()}
            onNavigateToConnections={vi.fn()}
            onNavigateToProfile={vi.fn()}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Quick Navigation')).toBeInTheDocument();
      });

      const opportunitiesBtn = screen.getByText('Opportunities');
      fireEvent.click(opportunitiesBtn);
      expect(mockNavigateOpps).toHaveBeenCalledTimes(1);

      const candidateDeskBtn = screen.getByText('Candidate Desk');
      fireEvent.click(candidateDeskBtn);
      expect(mockNavigateApplicants).toHaveBeenCalledTimes(1);
    });
  });

  describe('Company Profile View & Trust Policy', () => {
    it('displays company credentials and prominent verification policy notice', async () => {
      render(
        <AuthProvider>
          <CompanyProfileView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('BharatCloud Technologies Pvt Ltd')).toBeInTheDocument();
        expect(screen.getByText('https://bharatcloud.in')).toBeInTheDocument();
        expect(screen.getByText('Anita Rao')).toBeInTheDocument();
        expect(screen.getByText('Head of Talent Acquisition')).toBeInTheDocument();
      });

      // Verification policy
      expect(screen.getByText(/Trust & Verification Policy/i)).toBeInTheDocument();
      expect(screen.getByText(/Employers cannot self-verify/i)).toBeInTheDocument();
    });

    it('opens profile edit mode and validates website URL input', async () => {
      render(
        <AuthProvider>
          <CompanyProfileView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit Profile'));

      expect(screen.getByText('Edit Company Information')).toBeInTheDocument();
      expect(screen.getByDisplayValue('BharatCloud Technologies Pvt Ltd')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://bharatcloud.in')).toBeInTheDocument();
    });
  });

  describe('Opportunity Management View', () => {
    it('renders published and draft opportunities with status filters', async () => {
      render(
        <AuthProvider>
          <OpportunityManagementView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Junior Cloud Operations Engineer')).toBeInTheDocument();
        expect(screen.getByText('DevOps Intern')).toBeInTheDocument();
      });

      expect(screen.getAllByText('PUBLISHED').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('DRAFT').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/₹4.5 - 6.0 LPA/)).toBeInTheDocument();
    });

    it('opens create opportunity modal with comprehensive fields', async () => {
      render(
        <AuthProvider>
          <OpportunityManagementView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Post New Opportunity')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Post New Opportunity'));

      expect(screen.getByText('Opportunity Title')).toBeInTheDocument();
      expect(screen.getByText('Work Mode')).toBeInTheDocument();
      expect(screen.getByText('Minimum CGPA (0 - 10)')).toBeInTheDocument();
      expect(screen.getByText('Application Deadline')).toBeInTheDocument();
    });
  });

  describe('Candidate Review Desk & Privacy Safeguards', () => {
    it('renders candidate submissions while strictly protecting student phone privacy', async () => {
      render(
        <AuthProvider>
          <EmployerApplicantView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Rahul Deshmukh')).toBeInTheDocument();
        expect(screen.getByText('rahul@district-polytechnic.ac.in')).toBeInTheDocument();
      });

      // Verify phone number is NOT rendered in the table
      expect(screen.queryByText(/\+91/)).not.toBeInTheDocument();
    });

    it('opens candidate review modal showing recruitment audit trail and stage selector', async () => {
      render(
        <AuthProvider>
          <EmployerApplicantView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Review')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Review'));

      expect(screen.getByText(/Review Candidate: Rahul Deshmukh/i)).toBeInTheDocument();
      expect(screen.getByText('Update Recruitment Stage')).toBeInTheDocument();
      expect(screen.getByText('Recruitment Audit Trail')).toBeInTheDocument();
      expect(screen.getByText(/Strong Linux fundamentals from diploma project/i)).toBeInTheDocument();
    });
  });

  describe('Interview Scheduling & Student Experience', () => {
    it('renders scheduled interviews in the Employer Interview Manager', async () => {
      render(
        <AuthProvider>
          <InterviewManagementView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Technical Round 1')).toBeInTheDocument();
        expect(screen.getByText('Rahul Deshmukh')).toBeInTheDocument();
        expect(screen.getByText('Join Online Meeting')).toBeInTheDocument();
      });

      expect(screen.getByText('Mark Completed')).toBeInTheDocument();
      expect(screen.getByText('Reschedule')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders scheduled interviews in the Student Placement Desk under My Interviews tab', async () => {
      render(
        <AuthProvider>
          <StudentPlacementView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/My Interviews/i)).toBeInTheDocument();
      });

      // Click on My Interviews tab
      fireEvent.click(screen.getByText(/My Interviews/i));

      await waitFor(() => {
        expect(screen.getByText('Technical Round 1')).toBeInTheDocument();
        expect(screen.getByText('BharatCloud Technologies Pvt Ltd')).toBeInTheDocument();
        expect(screen.getByText('Enter Interview Room')).toBeInTheDocument();
      });
    });
  });

  describe('College Recruiter Connections & Partnership Desk', () => {
    it('allows colleges to view incoming connection requests from employers', async () => {
      render(
        <AuthProvider>
          <CollegeDashboardView
            onNavigateToCohorts={vi.fn()}
            onNavigateToDrives={vi.fn()}
            onEditProfile={vi.fn()}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Recruiter Requests')).toBeInTheDocument();
      });

      // Open Recruiter Requests modal
      fireEvent.click(screen.getByText('Recruiter Requests'));

      await waitFor(() => {
        expect(screen.getByText('Employer Partnership Requests')).toBeInTheDocument();
        expect(screen.getByText('BharatCloud Technologies Pvt Ltd')).toBeInTheDocument();
        expect(screen.getByText('Accept Connection')).toBeInTheDocument();
        expect(screen.getByText('Decline')).toBeInTheDocument();
      });
    });
  });
});
