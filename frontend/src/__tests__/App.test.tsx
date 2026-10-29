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
    expect(screen.getByText(/For College Principals & Faculty/i)).toBeInTheDocument();
    expect(screen.getByText(/For Industry Recruiters/i)).toBeInTheDocument();
  });

  it('renders the system health diagnostic section', async () => {
    render(<App />);

    expect(screen.getByText(/System Health & API Monitor/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Recheck \/api\/health/i })).toBeInTheDocument();
    });
  });
});
