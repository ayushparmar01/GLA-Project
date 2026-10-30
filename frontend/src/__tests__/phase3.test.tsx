import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CohortManagementView } from '../components/CohortManagementView';
import { DriveManagementView } from '../components/DriveManagementView';
import { StudentPlacementView } from '../components/StudentPlacementView';
import { CollegeDashboardView } from '../components/CollegeDashboardView';
import { AuthProvider } from '../context/AuthContext';
import { SafeUser, CohortData, PlacementDriveData, CollegeStatsData } from '../types';

const mockCollegeUser: SafeUser = {
  id: 'usr_college_789',
  fullName: 'Dr. Suresh Patil',
  email: 'principal@rural-polytechnic.ac.in',
  role: 'COLLEGE',
  preferredLanguage: 'en',
  isActive: true,
  collegeProfile: {
    institutionName: 'District Polytechnic of Technology',
    institutionLocation: 'Nanded, Maharashtra',
    contactPerson: 'Dr. Suresh Patil',
    placementEmail: 'placement@rural-polytechnic.ac.in',
  },
  createdAt: '2026-10-29T18:00:00.000Z',
  updatedAt: '2026-10-29T18:00:00.000Z',
};

const mockStudentUser: SafeUser = {
  id: 'usr_student_123',
  fullName: 'Priya Sharma',
  email: 'priya@district-polytechnic.ac.in',
  role: 'STUDENT',
  preferredLanguage: 'en',
  isActive: true,
  studentProfile: {
    collegeName: 'District Polytechnic of Technology',
    course: 'Diploma in Computer Science & Engineering',
    graduationYear: 2026,
    skills: ['JavaScript', 'React', 'Node.js', 'SQL'],
    profileCompletionScore: 100,
  },
  createdAt: '2026-10-29T18:00:00.000Z',
  updatedAt: '2026-10-29T18:00:00.000Z',
};

const mockCohorts: CohortData[] = [
  {
    id: 'coh_1',
    name: 'Diploma CSE 2026',
    description: 'Final year computer engineering cohort',
    collegeId: 'usr_college_789',
    course: 'Diploma in Computer Science & Engineering',
    graduationYear: 2026,
    academicYear: '2025-2026',
    status: 'ACTIVE',
    studentCount: 24,
    createdAt: '2026-10-29T18:00:00.000Z',
    updatedAt: '2026-10-29T18:00:00.000Z',
  },
  {
    id: 'coh_2',
    name: 'Mechanical Batch 2025',
    description: 'Archived diploma batch',
    collegeId: 'usr_college_789',
    course: 'Diploma in Mechanical Engineering',
    graduationYear: 2025,
    status: 'ARCHIVED',
    studentCount: 18,
    createdAt: '2026-10-29T18:00:00.000Z',
    updatedAt: '2026-10-29T18:00:00.000Z',
  },
];

const mockDrives: PlacementDriveData[] = [
  {
    id: 'drv_1',
    title: 'Junior Fullstack Engineer',
    description: 'Developing digital services for semi-urban public infrastructure.',
    collegeId: 'usr_college_789',
    createdBy: 'usr_college_789',
    organizationName: 'BharatTech Innovations',
    opportunityType: 'JOB',
    workMode: 'HYBRID',
    location: 'Pune / Remote',
    applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
    status: 'PUBLISHED',
    applicationCount: 5,
    requiredSkills: ['JavaScript', 'React', 'SQL'],
    eligibleCourses: ['Diploma in Computer Science & Engineering'],
    eligibleGraduationYears: [2026],
    createdAt: '2026-10-29T18:00:00.000Z',
    updatedAt: '2026-10-29T18:00:00.000Z',
  },
  {
    id: 'drv_2',
    title: 'Cloud Support Trainee',
    description: 'Draft drive under review',
    collegeId: 'usr_college_789',
    createdBy: 'usr_college_789',
    organizationName: 'CloudBharat',
    opportunityType: 'INTERNSHIP',
    workMode: 'ONSITE',
    location: 'Nagpur',
    applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    status: 'DRAFT',
    applicationCount: 0,
    requiredSkills: ['Linux', 'Networking'],
    createdAt: '2026-10-29T18:00:00.000Z',
    updatedAt: '2026-10-29T18:00:00.000Z',
  },
];

const mockStats: CollegeStatsData = {
  totalCohorts: 2,
  activeCohorts: 1,
  totalStudentsEnrolled: 42,
  totalDrives: 2,
  publishedDrives: 1,
  totalApplications: 5,
  recentCohorts: mockCohorts,
  recentDrives: mockDrives,
};

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Phase 3: Automated Placement Cell & Cohort Frontend Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    mockFetch.mockImplementation(async (url: string) => {
      const u = String(url);

      if (u.includes('/api/auth/me')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: { user: mockCollegeUser } }),
        };
      }

      if (u.includes('/api/college/stats')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockStats }),
        };
      }

      if (u.includes('/api/cohorts/coh_1/students')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              cohort: mockCohorts[0],
              students: [
                {
                  id: 'usr_student_123',
                  fullName: 'Priya Sharma',
                  email: 'priya@district-polytechnic.ac.in',
                  course: 'Diploma in Computer Science & Engineering',
                  educationLevel: 'Diploma',
                  graduationYear: 2026,
                  skills: ['JavaScript', 'React'],
                  profileCompletionScore: 100,
                },
              ],
            },
          }),
        };
      }

      if (u.includes('/api/cohorts')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockCohorts }),
        };
      }

      if (u.includes('/api/placement-drives/drv_1/eligibility')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              drive: mockDrives[0],
              eligibility: {
                eligible: true,
                reasons: ['You satisfy all academic, skill, and cohort requirements for this drive.'],
                missingRequirements: [],
                checkedAt: new Date().toISOString(),
              },
            },
          }),
        };
      }

      if (u.includes('/api/placement-drives/drv_1/applications')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              drive: mockDrives[0],
              applications: [
                {
                  id: 'app_1',
                  driveId: 'drv_1',
                  studentId: 'usr_student_123',
                  collegeId: 'usr_college_789',
                  status: 'APPLIED',
                  appliedAt: new Date().toISOString(),
                  student: mockStudentUser,
                },
              ],
            },
          }),
        };
      }

      if (u.includes('/api/placement-drives')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: mockDrives }),
        };
      }

      if (u.includes('/api/applications/me')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: [
              {
                id: 'app_1',
                driveId: 'drv_1',
                studentId: 'usr_student_123',
                collegeId: 'usr_college_789',
                status: 'APPLIED',
                appliedAt: new Date().toISOString(),
                drive: mockDrives[0],
              },
            ],
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({ success: true }),
      };
    });
  });

  describe('College Cohort Management View', () => {
    it('should render cohort list with student counts and status badges', async () => {
      render(
        <AuthProvider>
          <CohortManagementView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Diploma CSE 2026')).toBeInTheDocument();
      });

      expect(screen.getByText('24 Students')).toBeInTheDocument();
      expect(screen.getByText('Mechanical Batch 2025')).toBeInTheDocument();
    });

    it('should open student roster when "Manage Roster" is clicked', async () => {
      render(
        <AuthProvider>
          <CohortManagementView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Diploma CSE 2026')).toBeInTheDocument();
      });

      const manageButtons = screen.getAllByText('Manage Roster');
      fireEvent.click(manageButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Cohort Student Roster')).toBeInTheDocument();
        expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
        expect(screen.getByText('100% Ready')).toBeInTheDocument();
      });
    });

    it('should open create cohort modal when "Create New Cohort" is clicked', async () => {
      render(
        <AuthProvider>
          <CohortManagementView />
        </AuthProvider>
      );

      const createBtn = screen.getByText('Create New Cohort');
      fireEvent.click(createBtn);

      expect(screen.getByText('New Academic Cohort')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. Diploma CSE 2026 Batch')).toBeInTheDocument();
    });
  });

  describe('College Drive Management View', () => {
    it('should render placement drives with statuses and applicant count', async () => {
      render(
        <AuthProvider>
          <DriveManagementView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Junior Fullstack Engineer')).toBeInTheDocument();
      });

      expect(screen.getByText('BharatTech Innovations')).toBeInTheDocument();
      expect(screen.getByText('5 Applications')).toBeInTheDocument();
      expect(screen.getByText('CloudBharat')).toBeInTheDocument();
    });

    it('should open applicant review desk when clicking on applications count', async () => {
      render(
        <AuthProvider>
          <DriveManagementView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('5 Applications')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('5 Applications'));

      await waitFor(() => {
        expect(screen.getByText('Applicant Review Desk')).toBeInTheDocument();
        expect(screen.getByText('Shortlist')).toBeInTheDocument();
      });
    });
  });

  describe('College Dashboard Overview', () => {
    it('should render institutional KPI metrics accurately', async () => {
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
        expect(screen.getByText('42')).toBeInTheDocument(); // enrolled students
      });

      expect(screen.getByText('INSTITUTIONAL PLACEMENT DESK')).toBeInTheDocument();
      expect(screen.getByText('Total Cohorts')).toBeInTheDocument();
      expect(screen.getByText('Campus Drives')).toBeInTheDocument();
    });
  });

  describe('Student Placement Experience', () => {
    it('should render open drives tab and display explainable eligibility on click', async () => {
      render(
        <AuthProvider>
          <StudentPlacementView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Junior Fullstack Engineer')).toBeInTheDocument();
      });

      const checkBtns = screen.getAllByText('Check Eligibility');
      fireEvent.click(checkBtns[0]);

      await waitFor(() => {
        expect(screen.getByText('Eligibility Scorecard')).toBeInTheDocument();
        expect(screen.getByText('You Are Eligible for this Placement Drive!')).toBeInTheDocument();
      });
    });

    it('should allow switching to "My Applications" tab and display application status', async () => {
      render(
        <AuthProvider>
          <StudentPlacementView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/My Applications/)).toBeInTheDocument();
      });

      const myAppsTab = screen.getByText(/My Applications/);
      fireEvent.click(myAppsTab);

      await waitFor(() => {
        expect(screen.getByText('Junior Fullstack Engineer')).toBeInTheDocument();
        expect(screen.getByText('Withdraw')).toBeInTheDocument();
      });
    });
  });
});
