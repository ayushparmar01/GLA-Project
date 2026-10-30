import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

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
            timestamp: '2026-10-29T18:00:00.000Z',
            uptimeSeconds: 120,
            environment: 'test',
            services: {
              database: { status: 'connected', state: 'connected' },
              icanSandbox: {
                status: 'ready',
                configured: true,
                targetEnvironment: 'https://sandbox.ican.mock',
                note: 'Mock ICAN Sandbox',
              },
            },
          },
        }),
    })
  )
);

describe('CareerBridge App Initial Render', () => {
  it('renders application with brand title and mission context', async () => {
    render(<App />);

    // Brand and Hackathon challenge
    expect(screen.getAllByText(/Career/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Bridge/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/MISSION BHARAT/i).length).toBeGreaterThan(0);
  });

  it('renders core stakeholder persona segments', () => {
    render(<App />);

    expect(screen.getByText(/For Students/i)).toBeInTheDocument();
    expect(screen.getByText(/For Colleges/i)).toBeInTheDocument();
    expect(screen.getByText(/For Employers/i)).toBeInTheDocument();
    expect(screen.getByText(/For Alumni Mentors/i)).toBeInTheDocument();
  });

  it('verifies system health & API monitor UI is completely removed from user-facing frontend', () => {
    render(<App />);

    expect(screen.queryByText(/System Health & API Monitor/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/REAL-TIME PHASE 1 VERIFICATION/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Recheck \/api\/health/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Inspect JSON/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Express API Server/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ICAN Sandbox Adapter/i)).not.toBeInTheDocument();
  });
});
