import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';
import * as AuthContextModule from '../context/AuthContext';

// Mock fetch globally
vi.stubGlobal(
  'fetch',
  vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          data: {
            service: 'CareerBridge API',
            version: '0.1.0',
            status: 'healthy',
          },
        }),
    })
  )
);

describe('Industry-Grade Layout and Role-Based Navigation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('unauthenticated visitor sees public marketing navbar, CTAs, and marketing footer', () => {
    render(<App />);

    // Brand and Hackathon badge
    expect(screen.getAllByText(/Career/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Bridge/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/MISSION BHARAT/i).length).toBeGreaterThan(0);

    // Marketing navigation links
    expect(screen.getByRole('navigation', { name: /Public Marketing Navigation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Log In$/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Get Started/i).length).toBeGreaterThan(0);

    // Marketing footer should be visible on public pages
    expect(screen.getByText(/Autonomous career development and recruitment infrastructure/i)).toBeInTheDocument();

    // Authenticated app header and sidebar should NOT be present
    expect(screen.queryByLabelText(/Application Role Navigation/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/STUDENT PORTAL/i)).not.toBeInTheDocument();
  });

  it('navigating to login and register renders inside public layout with public navbar and footer', async () => {
    render(<App />);

    const loginBtn = screen.getByRole('button', { name: /^Log In$/i });
    fireEvent.click(loginBtn);

    // Login card is visible
    expect(screen.getByPlaceholderText(/name@college\.edu or name@company\.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Hackathon Evaluation Demo Credentials/i)).toBeInTheDocument();

    // Public marketing navbar is present during login
    expect(screen.getByRole('navigation', { name: /Public Marketing Navigation/i })).toBeInTheDocument();

    // Marketing footer is present during login
    expect(screen.getByText(/Autonomous career development and recruitment infrastructure/i)).toBeInTheDocument();
  });

  it('authenticated STUDENT does NOT see public marketing navbar or marketing footer, and sees AppSidebar + AppHeader', () => {
    const mockStudentUser = {
      id: 'student-01',
      fullName: 'Aarav Kumar',
      email: 'student01@careerbridge.demo',
      role: 'STUDENT' as const,
      preferredLanguage: 'en' as const,
      studentProfile: {
        skills: ['Electrical Maintenance', 'AutoCAD'],
        course: 'Diploma in Electrical',
        collegeName: 'Govt Polytechnic',
        profileCompletionScore: 85,
      },
    };

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockStudentUser as any,
      token: 'mock-jwt-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    render(<App />);

    // Public marketing navbar MUST BE ABSENT
    expect(screen.queryByRole('navigation', { name: /Public Marketing Navigation/i })).not.toBeInTheDocument();

    // Marketing footer MUST BE ABSENT
    expect(screen.queryByText(/Autonomous career development and recruitment infrastructure/i)).not.toBeInTheDocument();

    // Role-specific Application Sidebar MUST BE PRESENT
    expect(screen.getByRole('navigation', { name: /Application Role Navigation/i })).toBeInTheDocument();
    expect(screen.getByText(/STUDENT PORTAL/i)).toBeInTheDocument();

    // Student specific sidebar items
    expect(screen.getByText(/Career Readiness \(50 kbps\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Job Matches & Rationale/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Campus Drives/i)).toBeInTheDocument();
    expect(screen.getByText(/My Applications/i)).toBeInTheDocument();
    expect(screen.getByText(/ATS Resume Builder/i)).toBeInTheDocument();
    expect(screen.getByText(/Skill Assessments/i)).toBeInTheDocument();

    // AppHeader breadcrumb
    expect(screen.getByText(/Student Portal/i)).toBeInTheDocument();
  });

  it('authenticated EMPLOYER sees Employer Recruiter Console sidebar without marketing navbar', () => {
    const mockEmployerUser = {
      id: 'emp-01',
      fullName: 'Vikram Sethi',
      email: 'recruiter@tata.demo',
      role: 'EMPLOYER' as const,
      preferredLanguage: 'en' as const,
      employerProfile: {
        organizationName: 'Tata Power Ltd.',
        verificationStatus: 'VERIFIED',
      },
    };

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockEmployerUser as any,
      token: 'mock-jwt-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    render(<App />);

    // Public marketing navbar MUST BE ABSENT
    expect(screen.queryByRole('navigation', { name: /Public Marketing Navigation/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Autonomous career development and recruitment infrastructure/i)).not.toBeInTheDocument();

    // Employer Recruiter Console sidebar items
    expect(screen.getByText(/RECRUITER CONSOLE/i)).toBeInTheDocument();
    expect(screen.getByText(/Job & Drive Postings/i)).toBeInTheDocument();
    expect(screen.getByText(/Candidate Applicants/i)).toBeInTheDocument();
    expect(screen.getByText(/Interview Schedules/i)).toBeInTheDocument();
    expect(screen.getByText(/College Partnerships/i)).toBeInTheDocument();
    expect(screen.getByText(/Company Profile & Verification/i)).toBeInTheDocument();
  });

  it('authenticated COLLEGE sees Placement Cell sidebar without marketing navbar', () => {
    const mockCollegeUser = {
      id: 'col-01',
      fullName: 'Prof. Anant Kulkarni',
      email: 'college01@careerbridge.demo',
      role: 'COLLEGE' as const,
      preferredLanguage: 'en' as const,
      collegeProfile: {
        institutionName: 'Swami Vivekananda Rural Institute',
      },
    };

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockCollegeUser as any,
      token: 'mock-jwt-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    render(<App />);

    // Public marketing navbar MUST BE ABSENT
    expect(screen.queryByRole('navigation', { name: /Public Marketing Navigation/i })).not.toBeInTheDocument();

    // College Placement Cell sidebar items
    expect(screen.getByText(/PLACEMENT CELL/i)).toBeInTheDocument();
    expect(screen.getByText(/Placement Cell Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Student Cohorts/i)).toBeInTheDocument();
    expect(screen.getByText(/Placement Drives Coordination/i)).toBeInTheDocument();
  });

  it('authenticated ADMIN sees Admin Control sidebar without marketing navbar', () => {
    const mockAdminUser = {
      id: 'admin-01',
      fullName: 'Platform Admin',
      email: 'admin@careerbridge.demo',
      role: 'ADMIN' as const,
      preferredLanguage: 'en' as const,
    };

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockAdminUser as any,
      token: 'mock-jwt-token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    render(<App />);

    // Public marketing navbar MUST BE ABSENT
    expect(screen.queryByRole('navigation', { name: /Public Marketing Navigation/i })).not.toBeInTheDocument();

    // Admin Control sidebar items
    expect(screen.getByText(/ADMIN CONTROL/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Control Centre/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin Profile & Security/i)).toBeInTheDocument();
  });
});
