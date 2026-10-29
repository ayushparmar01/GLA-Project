import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterView } from '../components/RegisterView';
import { LoginView } from '../components/LoginView';
import { DashboardView } from '../components/DashboardView';
import { ProfileEditView } from '../components/ProfileEditView';
import { UnauthorizedView } from '../components/UnauthorizedView';
import { AuthProvider } from '../context/AuthContext';
import { SafeUser } from '../types';

const mockStudentUser: SafeUser = {
  id: 'usr_student_123',
  fullName: 'Ananya Deshmukh',
  email: 'ananya@tier3college.ac.in',
  role: 'STUDENT',
  preferredLanguage: 'en',
  phoneNumber: '+91 9876543210',
  isActive: true,
  studentProfile: {
    collegeName: 'Govt Polytechnic Nanded',
    course: 'Diploma in Information Technology',
    educationLevel: 'Diploma',
    graduationYear: 2026,
    skills: ['JavaScript', 'HTML5', 'Node.js'],
    careerInterests: ['Frontend Developer'],
    preferredWorkLocation: ['Pune'],
    profileCompletionScore: 100,
  },
  createdAt: '2026-10-29T18:00:00.000Z',
  updatedAt: '2026-10-29T18:00:00.000Z',
};

// Global fetch mock
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Frontend Authentication & Profile Experience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Default fetch handler for /api/auth/me
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/auth/me')) {
        return {
          ok: true,
          json: async () => ({ success: true, data: { user: mockStudentUser } }),
        };
      }
      return {
        ok: true,
        json: async () => ({ success: true }),
      };
    });
  });

  describe('Registration Form Validation and Role Selection', () => {
    it('should render all three role options and allow switching roles', () => {
      render(
        <AuthProvider>
          <RegisterView onSuccess={vi.fn()} onSwitchToLogin={vi.fn()} />
        </AuthProvider>
      );

      expect(screen.getByRole('button', { name: /student/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /college/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /employer/i })).toBeInTheDocument();

      // Click Employer role
      fireEvent.click(screen.getByRole('button', { name: /employer/i }));
      expect(screen.getByText(/Company \/ Organization Name/i)).toBeInTheDocument();

      // Click College role
      fireEvent.click(screen.getByRole('button', { name: /college/i }));
      expect(screen.getByText(/Institution Official Name/i)).toBeInTheDocument();
    });

    it('should validate password mismatch and show inline error message', async () => {
      render(
        <AuthProvider>
          <RegisterView onSuccess={vi.fn()} onSwitchToLogin={vi.fn()} />
        </AuthProvider>
      );

      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Ramesh Patel/i), {
        target: { value: 'Ramesh Patel' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. ramesh@college\.edu/i), {
        target: { value: 'ramesh@college.edu' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Min 8 chars, 1 uppercase, 1 symbol/i), {
        target: { value: 'Secret123!' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), {
        target: { value: 'MismatchPassword!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /complete registration/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should validate weak password and show inline error message', async () => {
      render(
        <AuthProvider>
          <RegisterView onSuccess={vi.fn()} onSwitchToLogin={vi.fn()} />
        </AuthProvider>
      );

      fireEvent.change(screen.getByPlaceholderText(/e\.g\. Ramesh Patel/i), {
        target: { value: 'Ramesh Patel' },
      });
      fireEvent.change(screen.getByPlaceholderText(/e\.g\. ramesh@college\.edu/i), {
        target: { value: 'ramesh@college.edu' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Min 8 chars, 1 uppercase, 1 symbol/i), {
        target: { value: 'short' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Re-enter password/i), {
        target: { value: 'short' },
      });

      fireEvent.click(screen.getByRole('button', { name: /complete registration/i }));

      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Login Form Validation and Error Handling', () => {
    it('should render login fields and submit button', () => {
      render(
        <AuthProvider>
          <LoginView onSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />
        </AuthProvider>
      );

      expect(screen.getByPlaceholderText(/name@college\.edu/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter your account password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should show error message when login API fails', async () => {
      mockFetch.mockImplementation(async (url: string) => {
        if (url.includes('/auth/login')) {
          return {
            ok: true,
            json: async () => ({
              success: false,
              error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password.',
              },
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({ success: false }),
        };
      });

      render(
        <AuthProvider>
          <LoginView onSuccess={vi.fn()} onSwitchToRegister={vi.fn()} />
        </AuthProvider>
      );

      fireEvent.change(screen.getByPlaceholderText(/name@college\.edu/i), {
        target: { value: 'wrong@college.edu' },
      });
      fireEvent.change(screen.getByPlaceholderText(/Enter your account password/i), {
        target: { value: 'WrongPassword123!' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated Dashboard & Profile Completion Score', () => {
    it('should display the student dashboard with 100% profile score and role badge', async () => {
      render(
        <AuthProvider>
          <DashboardView onEditProfile={vi.fn()} />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Ananya Deshmukh/i)).toBeInTheDocument();
        expect(screen.getByText(/STUDENT PORTAL/i)).toBeInTheDocument();
        expect(screen.getAllByText(/100%/i).length).toBeGreaterThan(0);
        expect(screen.getByText(/Govt Polytechnic Nanded/i)).toBeInTheDocument();
      });
    });
  });

  describe('Profile Editing Security Constraints', () => {
    it('should keep email and role locked and disabled to prevent client tampering', async () => {
      render(
        <AuthProvider>
          <ProfileEditView onBack={vi.fn()} />
        </AuthProvider>
      );

      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('ananya@tier3college.ac.in');
        const roleInput = screen.getByDisplayValue('STUDENT');

        expect(emailInput).toBeDisabled();
        expect(roleInput).toBeDisabled();
      });
    });
  });

  describe('Unauthorized / Access-Denied View', () => {
    it('should render HTTP 403 Forbidden with user current role', () => {
      render(
        <UnauthorizedView
          onBack={vi.fn()}
          requiredRole="EMPLOYER"
          userRole="STUDENT"
        />
      );

      expect(screen.getByText(/HTTP 403 Forbidden/i)).toBeInTheDocument();
      expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      expect(screen.getByText(/STUDENT/i)).toBeInTheDocument();
    });
  });
});
