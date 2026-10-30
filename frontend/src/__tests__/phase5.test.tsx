import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CareerProfileView } from '../components/student/CareerProfileView';
import { ProjectPortfolioView } from '../components/student/ProjectPortfolioView';
import { ResumeBuilderView } from '../components/student/ResumeBuilderView';
import { StudentPlacementView } from '../components/StudentPlacementView';
import { EmployerApplicantView } from '../components/employer/EmployerApplicantView';
import { AuthProvider } from '../context/AuthContext';
import {
  SafeUser,
  StudentProfileData,
  ProjectItem,
  ResumeData,
  ProfileCompletionReport,
  PlacementApplicationData,
} from '../types';

const mockProjects: ProjectItem[] = [
  {
    id: 'proj_01',
    title: 'Offline Rural Telehealth Kiosk',
    description: 'WebRTC-based medical triage consultation portal with local edge caching for clinics with intermittent connectivity.',
    technologies: ['React', 'TypeScript', 'IndexedDB', 'Node.js'],
    role: 'Lead Full-Stack Developer',
    duration: '3 Months',
    githubUrl: 'https://github.com/pooja-verma/telehealth-kiosk',
    liveDemoUrl: 'https://telehealth-demo.bharat.in',
    visibility: 'PUBLIC',
  },
];

const mockStudentUser: SafeUser = {
  id: 'usr_stud_101',
  fullName: 'Pooja Verma',
  email: 'pooja.verma@rural-eng.ac.in',
  role: 'STUDENT',
  preferredLanguage: 'en',
  phoneNumber: '+91 91234 56789',
  isActive: true,
  studentProfile: {
    collegeName: 'Government College of Engineering, Amravati',
    course: 'B.Tech Computer Science',
    graduationYear: 2026,
    educationLevel: 'Undergraduate',
    headline: 'Aspiring Full Stack Engineer & Open Source Contributor',
    careerObjective: 'Motivated engineer eager to build accessible web solutions for rural India.',
    technicalSkills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
    softSkills: ['Problem Solving', 'Team Leadership'],
    githubUrl: 'https://github.com/pooja-verma',
    linkedinUrl: 'https://linkedin.com/in/pooja-verma',
    portfolioUrl: 'https://poojaverma.dev',
    workModePreference: 'HYBRID',
    profileCompletionScore: 85,
    projects: mockProjects,
  },
  createdAt: '2026-10-29T18:00:00.000Z',
  updatedAt: '2026-10-29T18:00:00.000Z',
};

const mockCompletionReport: ProfileCompletionReport = {
  score: 85,
  isComplete: false,
  completedCount: 6,
  totalCount: 8,
  sections: [
    { key: 'basic_identity', label: 'Headline & Career Objective', weight: 15, completed: true, details: 'Headline and objective set' },
    { key: 'education', label: 'Academic Background', weight: 15, completed: true, details: 'College and course details verified' },
    { key: 'skills', label: 'Technical & Soft Skills', weight: 15, completed: true, details: '4 technical skills added' },
    { key: 'projects', label: 'Project Portfolio', weight: 15, completed: true, details: '1 project showcased' },
    { key: 'experience', label: 'Internships & Experience', weight: 15, completed: false, details: 'Add internship or work experience' },
    { key: 'certifications', label: 'Certifications & Honors', weight: 10, completed: true, details: 'Certifications verified' },
    { key: 'links', label: 'Professional Online Presence', weight: 5, completed: true, details: 'GitHub and LinkedIn linked' },
    { key: 'resume', label: 'ATS-Friendly Resume Built', weight: 10, completed: false, details: 'Build your first ATS resume' },
  ],
  nextSteps: ['Add internship or work experience', 'Build your first ATS resume in the Resume Builder'],
};

const mockResumes: ResumeData[] = [
  {
    id: 'res_01',
    studentId: 'usr_stud_101',
    title: 'Full Stack Web Developer ATS',
    template: 'MODERN',
    structuredContent: {
      personalInfo: {
        fullName: 'Pooja Verma',
        email: 'pooja.verma@rural-eng.ac.in',
        headline: 'Aspiring Full Stack Engineer',
        summary: 'Motivated software developer.',
      },
      education: [],
      technicalSkills: ['React', 'Node.js', 'TypeScript'],
      softSkills: ['Teamwork'],
      projects: mockProjects,
      experience: [],
      certifications: [],
      achievements: [],
    },
    version: 1,
    isDefault: true,
    createdAt: '2026-10-29T18:00:00.000Z',
    updatedAt: '2026-10-29T18:00:00.000Z',
  },
];

describe('Phase 5: Student Career Profile, Resume Builder & Portfolio UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('cb_auth_token', 'mock_jwt_student_token');

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        if (url.includes('/api/auth/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: { user: mockStudentUser } }),
          });
        }
        if (url.includes('/api/students/me/career-profile')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                success: true,
                data: { profile: mockStudentUser.studentProfile, user: mockStudentUser },
              }),
          });
        }
        if (url.includes('/api/students/me/profile-completion')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockCompletionReport }),
          });
        }
        if (url.includes('/api/students/me/projects')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockProjects[0] }),
          });
        }
        if (url.includes('/api/students/me/resumes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: mockResumes }),
          });
        }
        if (url.includes('/api/placement-drives')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        if (url.includes('/api/applications/me')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        if (url.includes('/api/cohorts')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        if (url.includes('/api/students/me/interviews')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, data: [] }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      })
    );
  });

  describe('1. Career Profile Dashboard & Completion Meter', () => {
    it('should render student profile strength meter and transparent sections breakdown', async () => {
      render(
        <AuthProvider>
          <CareerProfileView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Verified Career Portfolio')).toBeInTheDocument();
        expect(screen.getByText('Profile Strength')).toBeInTheDocument();
        expect(screen.getByText('85%')).toBeInTheDocument();
        expect(screen.getByText('Transparent Profile Breakdown')).toBeInTheDocument();
        expect(screen.getByText('Headline & Career Objective')).toBeInTheDocument();
        expect(screen.getByText('Academic Background')).toBeInTheDocument();
        expect(screen.getByText(/Next Steps to 100% Strength/)).toBeInTheDocument();
      });
    });

    it('should display technical skills tags and allow removing a skill tag', async () => {
      render(
        <AuthProvider>
          <CareerProfileView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('React')).toBeInTheDocument();
        expect(screen.getByText('TypeScript')).toBeInTheDocument();
        expect(screen.getByText('Node.js')).toBeInTheDocument();
      });
    });
  });

  describe('2. Project Portfolio Subsystem', () => {
    it('should display existing portfolio projects with tech stack and external links', async () => {
      render(
        <AuthProvider>
          <ProjectPortfolioView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Offline Rural Telehealth Kiosk')).toBeInTheDocument();
        expect(screen.getByText(/WebRTC-based medical triage/)).toBeInTheDocument();
        expect(screen.getByText('Lead Full-Stack Developer')).toBeInTheDocument();
        expect(screen.getByText('PUBLIC')).toBeInTheDocument();
        expect(screen.getByText('Repository')).toBeInTheDocument();
        expect(screen.getByText('Live Demo')).toBeInTheDocument();
      });
    });

    it('should open modal when clicking Add Project button and validate inputs', async () => {
      render(
        <AuthProvider>
          <ProjectPortfolioView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Add Project')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Add Project'));

      expect(screen.getByText('Add New Portfolio Project')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. Offline-First AgriTelemetry Hub')).toBeInTheDocument();
    });
  });

  describe('3. Resume Builder & Template Studio', () => {
    it('should render the three ATS-optimized templates: Modern, Professional, and Minimal', async () => {
      render(
        <AuthProvider>
          <ResumeBuilderView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Modern Accent')).toBeInTheDocument();
        expect(screen.getByText('Executive Classic')).toBeInTheDocument();
        expect(screen.getByText('High-Density Minimal')).toBeInTheDocument();
      });
    });

    it('should display section toggle buttons allowing customized ATS focus', async () => {
      render(
        <AuthProvider>
          <ResumeBuilderView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument();
        expect(screen.getByText('Skills')).toBeInTheDocument();
        expect(screen.getByText('Experience')).toBeInTheDocument();
        expect(screen.getByText('Projects')).toBeInTheDocument();
        expect(screen.getByText('Education')).toBeInTheDocument();
      });
    });

    it('should render the live ATS preview tab with candidate headline and contact details', async () => {
      render(
        <AuthProvider>
          <ResumeBuilderView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Live ATS Preview')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Live ATS Preview'));

      expect(screen.getByText(/Live Preview: MODERN ATS Template/)).toBeInTheDocument();
      expect(screen.getByText('Pooja Verma')).toBeInTheDocument();
    });

    it('should list saved resume versions with ATS PDF download action', async () => {
      render(
        <AuthProvider>
          <ResumeBuilderView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Saved Versions/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/Saved Versions/));

      expect(screen.getByText('Full Stack Web Developer ATS')).toBeInTheDocument();
      expect(screen.getByText('v1')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(screen.getByText('Download ATS PDF')).toBeInTheDocument();
    });
  });

  describe('4. Student Placement Desk Integrated Navigation', () => {
    it('should switch between Open Drives, Career Profile, Project Portfolio, and ATS Resumes tabs', async () => {
      render(
        <AuthProvider>
          <StudentPlacementView />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Career Profile')).toBeInTheDocument();
        expect(screen.getByText('Project Portfolio')).toBeInTheDocument();
        expect(screen.getByText('ATS Resumes')).toBeInTheDocument();
      });

      // Click Career Profile tab
      fireEvent.click(screen.getByRole('button', { name: /Career Profile/i }));
      await waitFor(() => {
        expect(screen.getAllByText('Verified Career Portfolio').length).toBeGreaterThanOrEqual(1);
      });

      // Click Project Portfolio tab
      fireEvent.click(screen.getByRole('button', { name: /^Project Portfolio$/i }));
      await waitFor(() => {
        expect(screen.getByText('Offline Rural Telehealth Kiosk')).toBeInTheDocument();
      });

      // Click ATS Resumes tab
      fireEvent.click(screen.getByRole('button', { name: /^ATS Resumes$/i }));
      await waitFor(() => {
        expect(screen.getByText('Modern Accent')).toBeInTheDocument();
      });
    });
  });
});
