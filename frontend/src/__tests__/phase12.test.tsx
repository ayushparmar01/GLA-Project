import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React, { useState } from 'react';
import { registerServiceWorker } from '../pwa/registerServiceWorker';
import { usePwaInstall } from '../pwa/usePwaInstall';
import { useNetworkStatus } from '../pwa/useNetworkStatus';
import { PwaInstallBanner } from '../components/pwa/PwaInstallBanner';
import { OfflineIndicator } from '../components/pwa/OfflineIndicator';
import { CachedSnapshotBadge } from '../components/pwa/CachedSnapshotBadge';
import { useDebounce } from '../hooks/useDebounce';
import { saveLocalDraft, loadLocalDraft, clearLocalDraft } from '../utils/offlineStorage';
import { fetchWithTimeout } from '../services/api';
import { manifestData } from '../pwa/manifestConfig';

describe('Phase 12 — Progressive Web App (PWA) & Low-Bandwidth Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Web App Manifest Validity & PWA Configuration', () => {
    it('should have a valid Web App Manifest with required PWA metadata', () => {
      expect(manifestData).toBeDefined();
      expect(manifestData.name).toBe('CareerBridge — Placement Access Platform');
      expect(manifestData.short_name).toBe('CareerBridge');
      expect(manifestData.start_url).toBe('/');
      expect(manifestData.display).toBe('standalone');
      expect(manifestData.orientation).toBe('portrait-primary');
      expect(manifestData.background_color).toBe('#0f172a');
      expect(manifestData.theme_color).toBe('#059669');
      expect(manifestData.categories).toContain('education');
      expect(manifestData.categories).toContain('business');
    });

    it('should configure required icon definitions including 192x192, 512x512 and maskable icons', () => {
      expect(Array.isArray(manifestData.icons)).toBe(true);
      expect(manifestData.icons.length).toBeGreaterThanOrEqual(4);

      const sizes = manifestData.icons.map((icon) => icon.sizes);
      expect(sizes).toContain('192x192');
      expect(sizes).toContain('512x512');

      const maskables = manifestData.icons.filter((icon) => icon.purpose?.includes('maskable'));
      expect(maskables.length).toBeGreaterThanOrEqual(1);
    });

    it('should configure fast navigation shortcuts for opportunities and placement desk', () => {
      expect(Array.isArray(manifestData.shortcuts)).toBe(true);
      expect(manifestData.shortcuts.length).toBeGreaterThanOrEqual(2);
      const urls = manifestData.shortcuts.map((s) => s.url);
      expect(urls).toContain('/#opportunities');
      expect(urls).toContain('/#student-placement');
    });
  });

  describe('2. Service Worker Registration & Lifecycle', () => {
    it('should attempt registration of /sw.js when serviceWorker API is present', () => {
      const mockRegister = vi.fn().mockResolvedValue({
        scope: '/',
        addEventListener: vi.fn(),
      });

      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: mockRegister,
          controller: null,
        },
        writable: true,
        configurable: true,
      });

      const onSuccess = vi.fn();
      registerServiceWorker({ onSuccess });

      // Trigger window load
      window.dispatchEvent(new Event('load'));

      expect(mockRegister).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    });
  });

  describe('3. PWA Installability Experience (usePwaInstall & PwaInstallBanner)', () => {
    const TestInstallConsumer: React.FC = () => {
      const { isInstallable, isInstalled, promptInstall } = usePwaInstall();
      return (
        <div>
          <span data-testid="installable">{String(isInstallable)}</span>
          <span data-testid="installed">{String(isInstalled)}</span>
          <button data-testid="install-btn" onClick={promptInstall}>
            Install
          </button>
          <PwaInstallBanner variant="banner" />
        </div>
      );
    };

    it('should capture beforeinstallprompt and display the install banner', async () => {
      render(<TestInstallConsumer />);

      expect(screen.getByTestId('installable').textContent).toBe('false');

      // Create and dispatch mock BeforeInstallPromptEvent
      const mockPromptEvent = new Event('beforeinstallprompt');
      (mockPromptEvent as any).prompt = vi.fn().mockResolvedValue(undefined);
      (mockPromptEvent as any).userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });

      act(() => {
        window.dispatchEvent(mockPromptEvent);
      });

      await waitFor(() => {
        expect(screen.getByTestId('installable').textContent).toBe('true');
        expect(screen.getByText('Install CareerBridge App')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Install Free/i })).toBeInTheDocument();
      });
    });

    it('should trigger promptInstall when clicking Install button', async () => {
      render(<TestInstallConsumer />);

      const mockPrompt = vi.fn().mockResolvedValue(undefined);
      const mockPromptEvent = new Event('beforeinstallprompt');
      (mockPromptEvent as any).prompt = mockPrompt;
      (mockPromptEvent as any).userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });

      act(() => {
        window.dispatchEvent(mockPromptEvent);
      });

      const installBtn = await screen.findByRole('button', { name: /Install Free/i });
      fireEvent.click(installBtn);

      await waitFor(() => {
        expect(mockPrompt).toHaveBeenCalled();
      });
    });

    it('should dismiss the install banner and persist dismissal to localStorage', async () => {
      render(<TestInstallConsumer />);

      const mockPromptEvent = new Event('beforeinstallprompt');
      (mockPromptEvent as any).prompt = vi.fn();
      (mockPromptEvent as any).userChoice = Promise.resolve({ outcome: 'dismissed' });

      act(() => {
        window.dispatchEvent(mockPromptEvent);
      });

      const dismissBtn = await screen.findByRole('button', { name: /Not Now/i });
      fireEvent.click(dismissBtn);

      await waitFor(() => {
        expect(screen.queryByText('Install CareerBridge App')).not.toBeInTheDocument();
        expect(localStorage.getItem('cb_pwa_install_dismissed')).toBe('true');
      });
    });

    it('should render pill variant button for compact headers', () => {
      render(<PwaInstallBanner variant="pill" />);
      // Initially not installable until event fires
      expect(screen.queryByText('Install App')).not.toBeInTheDocument();
    });
  });

  describe('4. Network Experience & Offline Indicators', () => {
    it('should detect offline transition and display alert banner with retry button', async () => {
      render(<OfflineIndicator />);

      // Initially online -> nothing displayed
      expect(screen.queryByText(/Offline Mode Active/i)).not.toBeInTheDocument();

      // Dispatch offline event
      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Offline Mode Active:/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry Connection/i })).toBeInTheDocument();
      });
    });

    it('should show connection restored notice when returning online', async () => {
      render(<OfflineIndicator />);

      act(() => {
        window.dispatchEvent(new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Offline Mode Active:/i)).toBeInTheDocument();
      });

      act(() => {
        window.dispatchEvent(new Event('online'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Connection Restored! You are back online/i)).toBeInTheDocument();
      });
    });
  });

  describe('5. Cache Safety & Stale Data Disclosure', () => {
    it('should render CachedSnapshotBadge with formatted timestamp ensuring stale data disclosure', () => {
      const fixedDate = '2026-10-30T10:30:00.000Z';
      render(<CachedSnapshotBadge timestamp={fixedDate} />);

      expect(screen.getByText(/Cached Snapshot/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should save safe non-sensitive draft data to localStorage', () => {
      const safeData = { title: 'Junior Frontend Developer', skills: ['React', 'TypeScript'] };
      const success = saveLocalDraft('user_profile_draft', safeData);

      expect(success).toBe(true);

      const loaded = loadLocalDraft('user_profile_draft');
      expect(loaded).toEqual(safeData);
    });

    it('should strictly refuse to store sensitive keys in client draft caches', () => {
      const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(saveLocalDraft('user_password', 'SecretPass123!')).toBe(false);
      expect(saveLocalDraft('auth_token', 'jwt-token-xyz')).toBe(false);
      expect(saveLocalDraft('admin_secret_key', 'admin-key-abc')).toBe(false);

      expect(loadLocalDraft('user_password')).toBeNull();
      expect(loadLocalDraft('auth_token')).toBeNull();

      spyWarn.mockRestore();
    });

    it('should clear drafts from localStorage using clearLocalDraft', () => {
      saveLocalDraft('temp_resume_notes', { note: 'Completed project A' });
      expect(loadLocalDraft('temp_resume_notes')).not.toBeNull();

      clearLocalDraft('temp_resume_notes');
      expect(loadLocalDraft('temp_resume_notes')).toBeNull();
    });
  });

  describe('6. Low-Bandwidth Optimizations (useDebounce & fetchWithTimeout)', () => {
    const DebounceTestComponent: React.FC<{ inputVal: string }> = ({ inputVal }) => {
      const debounced = useDebounce(inputVal, 200);
      return <div data-testid="debounced-output">{debounced}</div>;
    };

    it('should delay updating value until debounce delay has elapsed', async () => {
      vi.useFakeTimers();

      const { rerender } = render(<DebounceTestComponent inputVal="initial" />);
      expect(screen.getByTestId('debounced-output').textContent).toBe('initial');

      // Rapidly update value
      rerender(<DebounceTestComponent inputVal="search query 1" />);
      expect(screen.getByTestId('debounced-output').textContent).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(100);
      });
      // Still not updated after 100ms
      expect(screen.getByTestId('debounced-output').textContent).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(150);
      });
      // Updated after 250ms total
      expect(screen.getByTestId('debounced-output').textContent).toBe('search query 1');

      vi.useRealTimers();
    });

    it('fetchWithTimeout should complete successfully within timeout limit', async () => {
      const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' })));
      global.fetch = mockFetch;

      const response = await fetchWithTimeout('/api/health', { method: 'GET' }, 5000);
      expect(response).toBeDefined();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('fetchWithTimeout should abort when request exceeds timeout threshold', async () => {
      // Mock fetch that hangs forever
      global.fetch = vi.fn().mockImplementation((_url, init) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('The user aborted a request.');
            err.name = 'AbortError';
            reject(err);
          });
        });
      });

      await expect(
        fetchWithTimeout('/api/slow-endpoint', { method: 'GET' }, 100)
      ).rejects.toThrow(/timed out after 0.1s on slow network/i);
    });
  });
});
