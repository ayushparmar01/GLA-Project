import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { I18nProvider, useTranslation } from '../i18n/I18nContext';
import { LanguageSelector } from '../components/common/LanguageSelector';
import {
  lookupTranslation,
  formatI18nDate,
  formatI18nNumber,
  formatI18nCurrency,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  isSupportedLanguage,
} from '../i18n/index';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    updateLanguagePreferenceApi: vi.fn().mockResolvedValue({
      success: true,
      data: { message: 'Language preference updated', preferredLanguage: 'hi' },
    }),
  };
});

describe('Phase 11 — Multilingual Localization & Language Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'en';
    }
  });

  describe('1. Core i18n Lookup and Fallback Engine', () => {
    it('should have 3 supported languages: en, hi, and hi-Latn', () => {
      expect(SUPPORTED_LANGUAGES.length).toBe(3);
      const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
      expect(codes).toContain('en');
      expect(codes).toContain('hi');
      expect(codes).toContain('hi-Latn');
      expect(DEFAULT_LANGUAGE).toBe('en');
    });

    it('should validate supported language codes accurately', () => {
      expect(isSupportedLanguage('en')).toBe(true);
      expect(isSupportedLanguage('hi')).toBe(true);
      expect(isSupportedLanguage('hi-Latn')).toBe(true);
      expect(isSupportedLanguage('fr')).toBe(false);
      expect(isSupportedLanguage('es')).toBe(false);
      expect(isSupportedLanguage('')).toBe(false);
    });

    it('should translate keys correctly in English (default)', () => {
      expect(lookupTranslation('en', 'common.actions.save')).toBe('Save Changes');
      expect(lookupTranslation('en', 'common.actions.cancel')).toBe('Cancel');
      expect(lookupTranslation('en', 'auth.login.title')).toBe('Welcome Back to CareerBridge');
      expect(lookupTranslation('en', 'student.dashboard.welcome', { name: 'Pooja' })).toBe('Welcome back, Pooja!');
    });

    it('should translate keys correctly in Hindi (Devanagari)', () => {
      expect(lookupTranslation('hi', 'common.actions.save')).toBe('परिवर्तन सहेजें');
      expect(lookupTranslation('hi', 'common.actions.cancel')).toBe('रद्द करें');
      expect(lookupTranslation('hi', 'auth.login.title')).toBe('CareerBridge में आपका स्वागत है');
      expect(lookupTranslation('hi', 'student.dashboard.welcome', { name: 'पूजा' })).toBe('स्वागत है, पूजा!');
    });

    it('should translate keys correctly in Hinglish (Roman colloquial)', () => {
      expect(lookupTranslation('hi-Latn', 'common.actions.save')).toBe('Changes Save Karein');
      expect(lookupTranslation('hi-Latn', 'common.actions.cancel')).toBe('Cancel');
      expect(lookupTranslation('hi-Latn', 'auth.login.title')).toBe('CareerBridge me Welcome Back');
      expect(lookupTranslation('hi-Latn', 'student.dashboard.welcome', { name: 'Pooja' })).toBe('Welcome back, Pooja!');
    });

    it('should preserve technical terminology in Hindi and Hinglish translations', () => {
      const hiJobs = lookupTranslation('hi', 'jobs.title');
      expect(hiJobs).toContain('कैंपस प्लेसमेंट ड्राइव्स');

      const hiLatnJobs = lookupTranslation('hi-Latn', 'jobs.title');
      expect(hiLatnJobs).toContain('Campus Placement Drives & Opportunities');

      const hiResume = lookupTranslation('hi', 'resume.builder');
      expect(hiResume).toContain('रिज्यूमे');

      const hiLatnResume = lookupTranslation('hi-Latn', 'resume.builder');
      expect(hiLatnResume).toBe('ATS Resume Builder');
    });

    it('should interpolate parameterized values correctly across all languages', () => {
      const enTemplate = lookupTranslation('en', 'notifications.unreadCount', { count: 5 });
      expect(enTemplate).toBe('5 Unread');

      const hiTemplate = lookupTranslation('hi', 'notifications.unreadCount', { count: 3 });
      expect(hiTemplate).toBe('3 अपठित');

      const hiLatnTemplate = lookupTranslation('hi-Latn', 'notifications.unreadCount', { count: 4 });
      expect(hiLatnTemplate).toBe('4 Unread');
    });

    it('should fall back gracefully to English when a key is missing in Hindi/Hinglish', () => {
      const nonExistent = lookupTranslation('hi', 'some.non.existent.key');
      expect(nonExistent).toBe('some.non.existent.key');
    });
  });

  describe('2. Date, Number and Currency Formatters', () => {
    const testDate = new Date('2026-10-30T10:30:00.000Z');

    it('should format dates according to the chosen language', () => {
      const enDate = formatI18nDate(testDate, 'en', { dateStyle: 'medium' });
      expect(enDate).toBeDefined();
      expect(enDate.length).toBeGreaterThan(0);

      const hiDate = formatI18nDate(testDate, 'hi', { dateStyle: 'medium' });
      expect(hiDate).toBeDefined();
      expect(hiDate.length).toBeGreaterThan(0);
    });

    it('should format numbers with proper locale formatting', () => {
      const enNum = formatI18nNumber(125000, 'en');
      expect(enNum).toBe('1,25,000');

      const hiNum = formatI18nNumber(125000, 'hi');
      expect(hiNum).toBeDefined();
    });

    it('should format currency using Indian Rupee (₹) standards', () => {
      const enCur = formatI18nCurrency(650000, 'en');
      expect(enCur).toContain('₹');
      expect(enCur).toContain('6,50,000');

      const hiCur = formatI18nCurrency(650000, 'hi');
      expect(hiCur).toContain('₹');
    });
  });

  describe('3. LanguageSelector Component & Interactive State', () => {
    const TestConsumer: React.FC = () => {
      const { language, t } = useTranslation();
      return (
        <div>
          <span data-testid="current-lang">{language}</span>
          <span data-testid="save-btn">{t('common.actions.save')}</span>
          <LanguageSelector variant="compact" />
        </div>
      );
    };

    it('should render default English state and compact trigger button', () => {
      render(
        <I18nProvider initialLanguage="en">
          <TestConsumer />
        </I18nProvider>
      );

      expect(screen.getByTestId('current-lang').textContent).toBe('en');
      expect(screen.getByTestId('save-btn').textContent).toBe('Save Changes');

      const trigger = screen.getByRole('button', { name: /Language: English/i });
      expect(trigger).toBeInTheDocument();
      expect(document.documentElement.lang).toBe('en');
    });

    it('should open dropdown and switch to Hindi without page reload', async () => {
      render(
        <I18nProvider initialLanguage="en">
          <TestConsumer />
        </I18nProvider>
      );

      const trigger = screen.getByRole('button', { name: /Language: English/i });
      fireEvent.click(trigger);

      const hindiOption = screen.getByRole('option', { name: /हिंदी/i });
      expect(hindiOption).toBeInTheDocument();

      fireEvent.click(hindiOption);

      await waitFor(() => {
        expect(screen.getByTestId('current-lang').textContent).toBe('hi');
        expect(screen.getByTestId('save-btn').textContent).toBe('परिवर्तन सहेजें');
        expect(document.documentElement.lang).toBe('hi');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('hi');
      });
    });

    it('should switch to Hinglish and update text accordingly', async () => {
      render(
        <I18nProvider initialLanguage="en">
          <TestConsumer />
        </I18nProvider>
      );

      const trigger = screen.getByRole('button', { name: /Language: English/i });
      fireEvent.click(trigger);

      const hinglishOption = screen.getByRole('option', { name: /Hinglish/i });
      expect(hinglishOption).toBeInTheDocument();

      fireEvent.click(hinglishOption);

      await waitFor(() => {
        expect(screen.getByTestId('current-lang').textContent).toBe('hi-Latn');
        expect(screen.getByTestId('save-btn').textContent).toBe('Changes Save Karein');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('hi-Latn');
      });
    });

    it('should render inline variant with 3 selectable options', () => {
      render(
        <I18nProvider initialLanguage="en">
          <LanguageSelector variant="inline" />
        </I18nProvider>
      );

      expect(screen.getByText('Select Language')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('हिंदी')).toBeInTheDocument();
      expect(screen.getByText('Hinglish')).toBeInTheDocument();
    });

    it('should close dropdown when pressing Escape key', () => {
      render(
        <I18nProvider initialLanguage="en">
          <LanguageSelector variant="compact" />
        </I18nProvider>
      );

      const trigger = screen.getByRole('button', { name: /Language: English/i });
      fireEvent.click(trigger);
      expect(screen.getByRole('option', { name: /हिंदी/i })).toBeInTheDocument();

      fireEvent.keyDown(trigger, { key: 'Escape', code: 'Escape' });
      expect(screen.queryByRole('option', { name: /हिंदी/i })).not.toBeInTheDocument();
    });
  });

  describe('4. Backend Synchronization & Authenticated Context', () => {
    it('should call updateLanguagePreferenceApi when authenticated user changes language', async () => {
      const mockToken = 'mock-jwt-token-phase11';

      render(
        <I18nProvider initialLanguage="en" authToken={mockToken}>
          <LanguageSelector variant="compact" />
        </I18nProvider>
      );

      const trigger = screen.getByRole('button', { name: /Language: English/i });
      fireEvent.click(trigger);

      const hindiOption = screen.getByRole('option', { name: /हिंदी/i });
      fireEvent.click(hindiOption);

      await waitFor(() => {
        expect(api.updateLanguagePreferenceApi).toHaveBeenCalledWith('hi', mockToken);
      });
    });

    it('should not call updateLanguagePreferenceApi for guest users without token', async () => {
      render(
        <I18nProvider initialLanguage="en">
          <LanguageSelector variant="compact" />
        </I18nProvider>
      );

      const trigger = screen.getByRole('button', { name: /Language: English/i });
      fireEvent.click(trigger);

      const hindiOption = screen.getByRole('option', { name: /हिंदी/i });
      fireEvent.click(hindiOption);

      await waitFor(() => {
        expect(api.updateLanguagePreferenceApi).not.toHaveBeenCalled();
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('hi');
      });
    });

    it('should synchronize language when user logs in with userPreferredLanguage', async () => {
      const { rerender } = render(
        <I18nProvider initialLanguage="en" authToken={null} userPreferredLanguage={null}>
          <LanguageSelector variant="compact" />
        </I18nProvider>
      );

      expect(screen.getByRole('button', { name: /Language: English/i })).toBeInTheDocument();

      // User logs in and provides userPreferredLanguage = 'hi'
      rerender(
        <I18nProvider initialLanguage="en" authToken="logged-in-token" userPreferredLanguage="hi">
          <LanguageSelector variant="compact" />
        </I18nProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Language: हिंदी/i })).toBeInTheDocument();
        expect(document.documentElement.lang).toBe('hi');
      });
    });
  });

  describe('5. Accessibility and DOM Conformance', () => {
    it('should update document.documentElement.lang to match selected language', async () => {
      render(
        <I18nProvider initialLanguage="en">
          <LanguageSelector variant="compact" />
        </I18nProvider>
      );

      expect(document.documentElement.lang).toBe('en');

      const trigger = screen.getByRole('button', { name: /Language: English/i });
      fireEvent.click(trigger);
      fireEvent.click(screen.getByRole('option', { name: /हिंदी/i }));

      await waitFor(() => {
        expect(document.documentElement.lang).toBe('hi');
      });
    });

    it('should provide aria-label and role attributes on language options in inline variant', () => {
      render(
        <I18nProvider initialLanguage="en">
          <LanguageSelector variant="inline" />
        </I18nProvider>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
      expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
      expect(buttons[2]).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
