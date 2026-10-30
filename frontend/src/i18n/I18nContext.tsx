import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  SupportedLanguage,
  I18nContextType,
  lookupTranslation,
  formatI18nDate,
  formatI18nNumber,
  formatI18nCurrency,
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  getInitialLanguage,
  isSupportedLanguage,
} from './index';
import { updateLanguagePreferenceApi } from '../services/api';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  initialLanguage?: SupportedLanguage;
  authToken?: string | null;
  userPreferredLanguage?: string | null;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  initialLanguage,
  authToken,
  userPreferredLanguage,
}) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (initialLanguage && isSupportedLanguage(initialLanguage)) {
      return initialLanguage;
    }
    return getInitialLanguage();
  });

  // Sync with document element lang
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
    }
  }, [language]);

  // Synchronize when authenticated user logs in with an account preference
  useEffect(() => {
    if (userPreferredLanguage && isSupportedLanguage(userPreferredLanguage) && userPreferredLanguage !== language) {
      setLanguageState(userPreferredLanguage);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, userPreferredLanguage);
    }
  }, [userPreferredLanguage]);

  const changeLanguage = useCallback(
    async (newLang: SupportedLanguage) => {
      if (!isSupportedLanguage(newLang)) return;

      setLanguageState(newLang);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);

      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLang === 'hi' ? 'hi' : 'en';
      }

      // If user is authenticated, persist to backend
      if (authToken) {
        try {
          await updateLanguagePreferenceApi(newLang, authToken);
        } catch (err) {
          console.warn('[I18n] Failed to persist language to backend:', err);
        }
      }
    },
    [authToken]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return lookupTranslation(language, key, params);
    },
    [language]
  );

  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
      return formatI18nDate(date, language, options);
    },
    [language]
  );

  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions): string => {
      return formatI18nNumber(num, language, options);
    },
    [language]
  );

  const formatCurrency = useCallback(
    (amount: number): string => {
      return formatI18nCurrency(amount, language);
    },
    [language]
  );

  const value: I18nContextType = {
    language,
    changeLanguage,
    t,
    formatDate,
    formatNumber,
    formatCurrency,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isRTL: false,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    // Provide a safe fallback context if rendered outside provider (e.g. during isolated unit tests)
    return {
      language: DEFAULT_LANGUAGE,
      changeLanguage: async () => {},
      t: (key: string, params?: Record<string, string | number>) => lookupTranslation(DEFAULT_LANGUAGE, key, params),
      formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => formatI18nDate(date, DEFAULT_LANGUAGE, options),
      formatNumber: (num: number, options?: Intl.NumberFormatOptions) => formatI18nNumber(num, DEFAULT_LANGUAGE, options),
      formatCurrency: (amount: number) => formatI18nCurrency(amount, DEFAULT_LANGUAGE),
      supportedLanguages: SUPPORTED_LANGUAGES,
      isRTL: false,
    };
  }
  return context;
};
